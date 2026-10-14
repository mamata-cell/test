// Pre-embedded file uploads. Files are written to a local directory
// (cfg.UploadDir, kept out of git) and served back from this app's own origin at
// /api/uploads/{name} — no S3, no keys, nothing to configure.
//
// The client's filename is NEVER used on disk: every file gets a random
// `stored_name` with an extension from the allow-list below, which makes path
// traversal and content-type confusion impossible. Widen uploadTypes to accept
// more formats.
package main

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// maxUploadBytes caps a single upload. Raise it if your app takes bigger files.
const maxUploadBytes = 10 << 20 // 10 MiB

// uploadTypes is the extension allow-list. The value is the Content-Type we
// serve the file back with — we never echo the client's, so an .png can't be
// served as HTML and run script on our origin.
var uploadTypes = map[string]string{
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	".webp": "image/webp",
	".pdf":  "application/pdf",
	".txt":  "text/plain; charset=utf-8",
	".csv":  "text/csv; charset=utf-8",
}

// Upload is one stored file. URL is what the browser fetches (relative — the app
// is served from a single origin).
type Upload struct {
	ID           int64     `json:"id"`
	StoredName   string    `json:"stored_name"`
	OriginalName string    `json:"original_name"`
	ContentType  string    `json:"content_type"`
	ByteSize     int64     `json:"byte_size"`
	InsertedAt   time.Time `json:"inserted_at"`
	URL          string    `json:"url"`
}

// ensureUploadDir creates the upload directory at boot so the first upload never
// fails on a missing path.
func ensureUploadDir(dir string) error { return os.MkdirAll(dir, 0o755) }

// handleUpload stores one multipart file (form field "file") for the signed-in
// user and returns the created Upload.
func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// MaxBytesReader stops an oversized body at the socket instead of buffering
	// it — the size cap is enforced before we ever touch the disk.
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeJSON(w, http.StatusRequestEntityTooLarge, map[string]any{"error": "file_too_large"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_upload"})
		return
	}
	defer func() { _ = r.MultipartForm.RemoveAll() }()

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "file_required"})
		return
	}
	defer func() { _ = file.Close() }()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	contentType, allowed := uploadTypes[ext]
	if !allowed {
		writeJSON(w, http.StatusUnsupportedMediaType, map[string]any{"error": "unsupported_file_type"})
		return
	}

	name, err := newToken()
	if err != nil {
		serverError(w, r, "upload_failed", err)
		return
	}
	storedName := name + ext

	dst, err := os.Create(filepath.Join(s.cfg.UploadDir, storedName))
	if err != nil {
		serverError(w, r, "upload_failed", err)
		return
	}
	size, copyErr := io.Copy(dst, file)
	closeErr := dst.Close()
	if copyErr != nil || closeErr != nil {
		_ = os.Remove(filepath.Join(s.cfg.UploadDir, storedName))
		serverError(w, r, "upload_failed", err)
		return
	}

	up := Upload{StoredName: storedName, OriginalName: filepath.Base(header.Filename),
		ContentType: contentType, ByteSize: size}
	err = s.pool.QueryRow(r.Context(), `
		INSERT INTO uploads (user_id, stored_name, original_name, content_type, byte_size)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, inserted_at`,
		u.ID, up.StoredName, up.OriginalName, up.ContentType, up.ByteSize,
	).Scan(&up.ID, &up.InsertedAt)
	if err != nil {
		_ = os.Remove(filepath.Join(s.cfg.UploadDir, storedName))
		serverError(w, r, "upload_failed", err)
		return
	}
	up.URL = uploadURL(up.StoredName)

	writeJSON(w, http.StatusCreated, map[string]any{"upload": up})
}

// handleListUploads returns the signed-in user's own files, newest first.
func (s *Server) handleListUploads(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	rows, err := s.pool.Query(r.Context(), `
		SELECT id, stored_name, original_name, content_type, byte_size, inserted_at
		FROM uploads WHERE user_id = $1
		ORDER BY inserted_at DESC
		LIMIT 100`, u.ID)
	if err != nil {
		serverError(w, r, "list_failed", err)
		return
	}
	defer rows.Close()

	uploads := []Upload{}
	for rows.Next() {
		var up Upload
		if err := rows.Scan(&up.ID, &up.StoredName, &up.OriginalName, &up.ContentType,
			&up.ByteSize, &up.InsertedAt); err != nil {
			serverError(w, r, "list_failed", err)
			return
		}
		up.URL = uploadURL(up.StoredName)
		uploads = append(uploads, up)
	}

	writeJSON(w, http.StatusOK, map[string]any{"uploads": uploads})
}

// handleServeUpload streams a stored file back. The name must resolve to a row
// in `uploads`, so only files we wrote can ever be read — and the path is
// rebuilt from the stored name, never from the URL. Any signed-in user may fetch
// a file by its unguessable name (so uploads can be shared, e.g. an avatar); add
// `AND user_id = $2` below if your app needs owner-only files.
func (s *Server) handleServeUpload(w http.ResponseWriter, r *http.Request) {
	if _, ok := userFrom(r); !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	var storedName, contentType string
	var insertedAt time.Time
	err := s.pool.QueryRow(r.Context(),
		`SELECT stored_name, content_type, inserted_at FROM uploads WHERE stored_name = $1`,
		r.PathValue("name"),
	).Scan(&storedName, &contentType, &insertedAt)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
		return
	}

	f, err := os.Open(filepath.Join(s.cfg.UploadDir, filepath.Base(storedName)))
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
		return
	}
	defer func() { _ = f.Close() }()

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeContent(w, r, storedName, insertedAt, f)
}

func uploadURL(storedName string) string { return "/api/uploads/" + storedName }
