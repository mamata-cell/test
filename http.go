package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// serverError logs the CAUSE server-side and returns only a generic code to the
// client. ALWAYS use this for a 500 instead of calling writeJSON directly.
//
// A handler that answers `{"error":"query_failed"}` and logs nothing is
// undiagnosable from outside: the same code is typically written at a dozen
// call sites, so the response cannot say which one fired, and neither can the
// container log. Recovering the cause then means re-deriving it by hand — for a
// real app that meant running every candidate SQL statement against the live
// database, one at a time, before concluding the failure was never in SQL at
// all. One log line here replaces all of that.
//
// The client still learns nothing it should not: the code it receives is
// unchanged, and the detail goes only to the server log.
func serverError(w http.ResponseWriter, r *http.Request, code string, err error) {
	log.Printf("[go-api] 500 %s %s — %s: %v", r.Method, r.URL.Path, code, err)
	writeJSON(w, http.StatusInternalServerError, map[string]any{"error": code})
}

// decodeJSON reads a JSON request body into v.
func decodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func recoverMW(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("[go-api] panic: %v", rec)
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal_error"})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func logMW(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[go-api] %s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}
