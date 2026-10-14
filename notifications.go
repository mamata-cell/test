// Pre-embedded in-app notifications: one DB row per user per event, with an
// unread count for the nav badge and a list page. Purely in-app — no email, no
// push, nothing to configure.
//
// Raise one from your own code with s.notify(...):
//
//	s.notify(ctx, u.ID, "Order shipped", "Tracking #123", "success", "/orders/1")
//
// Every query below is scoped by user_id, so a user can only ever see (and mark
// read) their own notifications.
package main

import (
	"context"
	"net/http"
	"strconv"
	"time"
)

// Notification is one in-app message. Type is a free-form tag ("info",
// "success", "warning", "danger") the UI maps to a Badge variant; URL is where
// clicking it should go; ReadAt is nil until read.
type Notification struct {
	ID         int64      `json:"id"`
	Title      string     `json:"title"`
	Body       string     `json:"body"`
	Type       string     `json:"type"`
	URL        string     `json:"url"`
	ReadAt     *time.Time `json:"read_at"`
	InsertedAt time.Time  `json:"inserted_at"`
}

// notify creates a notification for a user. Call it from your own handlers when
// something worth telling them about happens.
func (s *Server) notify(ctx context.Context, userID int64, title, body, kind, url string) error {
	if kind == "" {
		kind = "info"
	}
	_, err := s.pool.Exec(ctx,
		`INSERT INTO notifications (user_id, title, body, type, url) VALUES ($1, $2, $3, $4, $5)`,
		userID, title, body, kind, url)
	return err
}

// handleListNotifications returns the user's notifications (newest first) plus
// the unread count, so the page and the nav badge agree in one round-trip.
func (s *Server) handleListNotifications(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	rows, err := s.pool.Query(r.Context(), `
		SELECT id, title, body, type, url, read_at, inserted_at
		FROM notifications WHERE user_id = $1
		ORDER BY inserted_at DESC
		LIMIT 50`, u.ID)
	if err != nil {
		serverError(w, r, "list_failed", err)
		return
	}
	defer rows.Close()

	list := []Notification{}
	unread := 0
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.Title, &n.Body, &n.Type, &n.URL, &n.ReadAt, &n.InsertedAt); err != nil {
			serverError(w, r, "list_failed", err)
			return
		}
		if n.ReadAt == nil {
			unread++
		}
		list = append(list, n)
	}

	writeJSON(w, http.StatusOK, map[string]any{"notifications": list, "unread": unread})
}

// handleUnreadCount is the cheap query behind the nav badge.
func (s *Server) handleUnreadCount(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	var unread int
	if err := s.pool.QueryRow(r.Context(),
		`SELECT count(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`, u.ID,
	).Scan(&unread); err != nil {
		serverError(w, r, "count_failed", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"unread": unread})
}

// handleCreateNotification raises a notification for the signed-in user. It
// exists so the starter page has something to demo; real apps call s.notify
// from their own domain events instead — delete this handler and its route once
// yours does.
func (s *Server) handleCreateNotification(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	var in struct {
		Title string `json:"title"`
		Body  string `json:"body"`
		Type  string `json:"type"`
		URL   string `json:"url"`
	}
	if err := decodeJSON(r, &in); err != nil || in.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "title_required"})
		return
	}

	if err := s.notify(r.Context(), u.ID, in.Title, in.Body, in.Type, in.URL); err != nil {
		serverError(w, r, "create_failed", err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// handleMarkRead marks one notification read. The user_id in the WHERE clause is
// what stops a user marking (or probing for) someone else's notification.
func (s *Server) handleMarkRead(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_id"})
		return
	}

	tag, err := s.pool.Exec(r.Context(),
		`UPDATE notifications SET read_at = now()
		 WHERE id = $1 AND user_id = $2 AND read_at IS NULL`, id, u.ID)
	if err != nil {
		serverError(w, r, "update_failed", err)
		return
	}
	if tag.RowsAffected() == 0 {
		// Either it isn't theirs or it was already read — same answer either way,
		// so nothing leaks about other users' rows.
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// handleMarkAllRead clears the badge in one shot.
func (s *Server) handleMarkAllRead(w http.ResponseWriter, r *http.Request) {
	u, ok := userFrom(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	if _, err := s.pool.Exec(r.Context(),
		`UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`, u.ID,
	); err != nil {
		serverError(w, r, "update_failed", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
