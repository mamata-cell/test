package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const sessionCookie = "session"
const sessionTTL = 30 * 24 * time.Hour

// User is a signed-in user. `id` is the stable key your app's tables FK to.
type User struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

// googleOnlyPasswordHash is the password_hash stored for an account that signs in
// through Google. password_hash is NOT NULL, and this is not a valid bcrypt hash,
// so CompareHashAndPassword always errors — the email+password path can never open
// a Google account. (Django's set_unusable_password does the same thing.)
const googleOnlyPasswordHash = ""

// Server wires the request handlers to the DB.
type Server struct {
	cfg   Config
	pool  *pgxpool.Pool
	logen *LogenAuth
}

func NewServer(cfg Config, pool *pgxpool.Pool) *Server {
	return &Server{cfg: cfg, pool: pool, logen: NewLogenAuth(cfg)}
}

func (s *Server) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/health", s.handleHealth)

	// Email + password auth. Endpoints live under /api so Vite proxies them to Go.
	mux.Handle("POST /api/auth/register", mutationGuard("register", 15, http.HandlerFunc(s.handleRegister)))
	mux.Handle("POST /api/auth/login", mutationGuard("login", 30, http.HandlerFunc(s.handleLogin)))
	mux.Handle("POST /api/auth/logout", mutationGuard("logout", 60, http.HandlerFunc(s.handleLogout)))
	mux.HandleFunc("GET /api/auth/me", s.handleMe)
	mux.HandleFunc("GET /api/auth/session", s.handleMe)
	s.protected(mux, "GET /api/account", s.handleAccount)
	mux.Handle("POST /api/contact", mutationGuard("contact", 20, http.HandlerFunc(s.handleContact)))

	// Google sign-in via Logen's proxy — no Google credentials needed (see logen.go).
	// These are browser NAVIGATIONS, not fetches. Do NOT hand-write the control: the
	// frontend ships <GoogleButton /> in frontend/src/ui.tsx, which points here, is an
	// <a>, and carries Google's own mark and colours. It is deliberately NOT on the
	// Login page yet — render it only AFTER tool__enable_google_auth has been called,
	// or Logen's proxy refuses the app and the user lands on a Logen page instead of
	// Google. Both routes end in the same session cookie as handleLogin, so requireUser
	// covers Google users with no extra work.
	mux.HandleFunc("GET /api/auth/google/login", s.handleGoogleLogin)
	mux.HandleFunc("GET /api/auth/google", s.handleGoogleLogin)
	mux.HandleFunc("GET /api/auth/google/callback", s.handleGoogleCallback)

	// Pre-embedded file uploads (uploads.go). Files are stored on local disk and
	// served back from this same origin at /api/uploads/{name}.
	s.protected(mux, "POST /api/uploads", s.handleUpload)
	s.protected(mux, "GET /api/uploads", s.handleListUploads)
	s.protected(mux, "GET /api/uploads/{name}", s.handleServeUpload)

	// Pre-embedded in-app notifications (notifications.go), scoped to the
	// signed-in user.
	s.protected(mux, "GET /api/notifications", s.handleListNotifications)
	s.protected(mux, "POST /api/notifications", s.handleCreateNotification)
	s.protected(mux, "GET /api/notifications/unread-count", s.handleUnreadCount)
	s.protected(mux, "POST /api/notifications/read-all", s.handleMarkAllRead)
	s.protected(mux, "POST /api/notifications/{id}/read", s.handleMarkRead)

	// Add your feature routes here. Register authenticated ones with s.protected
	// and read the user with userFrom(r).
}

// protected registers a route that requires a signed-in user. The handler reads
// them back with userFrom(r).
func (s *Server) protected(mux *http.ServeMux, pattern string, h http.HandlerFunc) {
	mux.Handle(pattern, s.requireUser(h))
}

// ── Handlers ────────────────────────────────────────────────────────────────

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "go-api"})
}

type credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var in credentials
	if err := decodeJSON(r, &in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_body"})
		return
	}
	email := normalizeEmail(in.Email)
	if !validEmail(email) || len(in.Password) < 8 || len(in.Password) > 72 || len(strings.TrimSpace(in.Name)) > 100 {
		writeJSON(w, http.StatusBadRequest,
			map[string]any{"error": "a valid email and a password of at least 8 characters are required"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		serverError(w, r, "hash_failed", err)
		return
	}

	var u User
	err = s.pool.QueryRow(r.Context(), `
		INSERT INTO users (email, name, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, email, name, role`,
		email, strings.TrimSpace(in.Name), string(hash),
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		if isUniqueViolation(err) {
			writeJSON(w, http.StatusConflict, map[string]any{"error": "email_taken"})
			return
		}
		serverError(w, r, "create_failed", err)
		return
	}

	if err := s.startSession(w, r.Context(), u); err != nil {
		serverError(w, r, "session_failed", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": u})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var in credentials
	if err := decodeJSON(r, &in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_body"})
		return
	}
	email := normalizeEmail(in.Email)
	if !validEmail(email) || len(in.Password) > 72 || in.Password == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "invalid_credentials"})
		return
	}

	var u User
	var hash string
	err := s.pool.QueryRow(r.Context(),
		`SELECT id, email, name, password_hash, role FROM users WHERE email = $1`, email,
	).Scan(&u.ID, &u.Email, &u.Name, &hash, &u.Role)
	// Same response whether the email is unknown or the password is wrong, so we
	// don't leak which emails exist.
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "invalid_credentials"})
		return
	}

	if err := s.startSession(w, r.Context(), u); err != nil {
		serverError(w, r, "session_failed", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": u})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil && c.Value != "" {
		if _, err := s.pool.Exec(r.Context(), `DELETE FROM sessions WHERE token = $1`, sessionDigest(c.Value)); err != nil {
			serverError(w, r, "logout_failed", err)
			return
		}
	}
	clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

// handleMe is the session probe: the SPA calls it on load to learn who (if anyone)
// is signed in. It returns 200 with {"user": null} when logged out — NOT 401 — so a
// normal logged-out visit is not surfaced as a failed request in the browser console.
// It is deliberately NOT wrapped in requireUser (which is still correct for actual
// protected feature routes).
func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	if u, ok := s.currentUser(r); ok {
		writeJSON(w, http.StatusOK, map[string]any{"user": u})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": nil})
}

// ── Google sign-in (via Logen's proxy) ───────────────────────────────────────

// handleGoogleLogin starts sign-in: 302 to Logen, which runs the OAuth and sends
// the browser back to handleGoogleCallback.
func (s *Server) handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	if !s.logen.Configured() {
		http.Redirect(w, r, "/sign-in?auth_error=unavailable", http.StatusFound)
		return
	}
	state, err := newToken()
	if err != nil { serverError(w, r, "state_failed", err); return }
	http.SetCookie(w, &http.Cookie{Name:"google_state", Value:state, Path:"/api/auth/google", HttpOnly:true, Secure:true, SameSite:http.SameSiteLaxMode, MaxAge:600})
	callback := publicOrigin(r) + "/api/auth/google/callback?state=" + url.QueryEscape(state)
	http.Redirect(w, r, s.logen.LoginURL(callback), http.StatusFound)
}

// handleGoogleCallback is where Logen returns the browser after Google. It trades
// the one-time session_id for the profile, upserts the user, and starts our own
// session.
//
// It always ends in a redirect, never JSON: the browser arrives here by navigation,
// so the user has to land back in the app. Errors go to /?auth_error=… for the SPA
// to render — a JSON body would be shown as raw text in the address bar.
func (s *Server) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	stateCookie, stateErr := r.Cookie("google_state")
	http.SetCookie(w, &http.Cookie{Name:"google_state", Value:"", Path:"/api/auth/google", HttpOnly:true, Secure:true, SameSite:http.SameSiteLaxMode, MaxAge:-1})
	if stateErr != nil || stateCookie.Value == "" || subtle.ConstantTimeCompare([]byte(stateCookie.Value), []byte(r.URL.Query().Get("state"))) != 1 {
		http.Redirect(w, r, "/sign-in?auth_error=invalid_state", http.StatusFound)
		return
	}
	// Logen reports its own failures (user cancelled, tenant misconfigured) here.
	if e := r.URL.Query().Get("error"); e != "" {
		http.Redirect(w, r, "/sign-in?auth_error="+url.QueryEscape(e), http.StatusFound)
		return
	}
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		http.Redirect(w, r, "/sign-in?auth_error=missing_session", http.StatusFound)
		return
	}

	profile, err := s.logen.Exchange(r.Context(), sessionID)
	if err != nil {
		log.Printf("[go-api] auth exchange failed: %v", err)
		http.Redirect(w, r, "/sign-in?auth_error=exchange_failed", http.StatusFound)
		return
	}

	u, err := s.upsertGoogleUser(r.Context(), profile)
	if err != nil {
		log.Printf("[go-api] upsert google user failed: %v", err)
		code := "exchange_failed"
		if errors.Is(err, errGoogleEmailConflict) { code = "email_conflict" }
		http.Redirect(w, r, "/sign-in?auth_error="+code, http.StatusFound)
		return
	}

	if err := s.startSession(w, r.Context(), u); err != nil {
		log.Printf("[go-api] start session failed: %v", err)
		http.Redirect(w, r, "/sign-in?auth_error=session_failed", http.StatusFound)
		return
	}
	http.Redirect(w, r, "/account", http.StatusFound)
}

var errGoogleEmailConflict = errors.New("existing email account requires email sign-in")

// Bind users to the verified provider subject, never merge by email alone.
func (s *Server) upsertGoogleUser(ctx context.Context, p LogenProfile) (User, error) {
	var u User
	if p.GoogleID == "" || !validEmail(normalizeEmail(p.Email)) { return u, errors.New("invalid provider identity") }
	tx, err := s.pool.Begin(ctx)
	if err != nil { return u, err }
	defer tx.Rollback(ctx)
	// Serialize callbacks for the same provider identity.
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, "google:"+p.GoogleID); err != nil { return u, err }
	err = tx.QueryRow(ctx, `SELECT u.id, u.email, u.name, u.role FROM auth_identities i JOIN users u ON u.id=i.user_id WHERE i.provider='google' AND i.provider_subject=$1`, p.GoogleID).Scan(&u.ID,&u.Email,&u.Name,&u.Role)
	if err == nil { return u, tx.Commit(ctx) }
	if !errors.Is(err, pgx.ErrNoRows) { return u, err }
	err = tx.QueryRow(ctx, `INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id,email,name,role`, normalizeEmail(p.Email), strings.TrimSpace(p.Name), googleOnlyPasswordHash).Scan(&u.ID,&u.Email,&u.Name,&u.Role)
	if isUniqueViolation(err) { return u, errGoogleEmailConflict }
	if err != nil { return u, err }
	if _, err = tx.Exec(ctx, `INSERT INTO auth_identities(user_id,provider,provider_subject) VALUES($1,'google',$2)`,u.ID,p.GoogleID); err != nil { return u,err }
	return u,tx.Commit(ctx)
}

// ── Sessions ──────────────────────────────────────────────────────────────────

func (s *Server) startSession(w http.ResponseWriter, ctx context.Context, u User) error {
	token, err := newToken()
	if err != nil {
		return err
	}
	if _, err := s.pool.Exec(ctx,
		`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
		sessionDigest(token), u.ID, time.Now().Add(sessionTTL),
	); err != nil {
		return err
	}
	setSessionCookie(w, token)
	return nil
}

func newToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// ── Auth plumbing ─────────────────────────────────────────────────────────────

type ctxKey string

const userCtxKey ctxKey = "user"

// requireUser rejects unauthenticated requests with 401 and otherwise passes the
// resolved User down via context (read it with userFrom).
func (s *Server) requireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, ok := s.currentUser(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userCtxKey, u)))
	})
}

func userFrom(r *http.Request) (User, bool) {
	u, ok := r.Context().Value(userCtxKey).(User)
	return u, ok
}

// currentUser resolves the session cookie to a User via the sessions table.
func (s *Server) currentUser(r *http.Request) (User, bool) {
	c, err := r.Cookie(sessionCookie)
	if err != nil || c.Value == "" {
		return User{}, false
	}
	var u User
	err = s.pool.QueryRow(r.Context(), `
		SELECT u.id, u.email, u.name, u.role
		FROM sessions s JOIN users u ON u.id = s.user_id
		WHERE s.token = $1 AND s.expires_at > now()`,
		sessionDigest(c.Value),
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		return User{}, false
	}
	return u, true
}

// ── Helpers ────────────────────────────────────────────────────────────────────

func normalizeEmail(e string) string { return strings.ToLower(strings.TrimSpace(e)) }

func validEmail(e string) bool {
	a, err := mail.ParseAddress(e)
	return err == nil && a.Address == e && len(e) <= 254 && !strings.ContainsAny(e, "\r\n")
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// ── Cookie ────────────────────────────────────────────────────────────────────

func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true, // served over Logen's TLS edge
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionTTL / time.Second),
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
