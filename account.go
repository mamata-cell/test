package main

import (
    "crypto/sha256"
    "encoding/hex"
    "net/http"
)

func sessionDigest(token string) string {
    digest := sha256.Sum256([]byte(token))
    return hex.EncodeToString(digest[:])
}

type accountResponse struct {
    User User `json:"user"`
    SignInMethod string `json:"sign_in_method"`
}

func (s *Server) handleAccount(w http.ResponseWriter, r *http.Request) {
    u, _ := userFrom(r)
    var google bool
    var password string
    err := s.pool.QueryRow(r.Context(), `SELECT password_hash, EXISTS(SELECT 1 FROM auth_identities WHERE user_id=$1 AND provider='google') FROM users WHERE id=$1`, u.ID).Scan(&password, &google)
    if err != nil { serverError(w, r, "account_failed", err); return }
    method := "Email and password"
    if google { method = "Google" }
    writeJSON(w, http.StatusOK, accountResponse{User:u, SignInMethod:method})
}
