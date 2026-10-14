package main

import (
    "net/http"
    "strings"
    "unicode/utf8"
)

type contactInput struct {
    Name string `json:"name"`
    Email string `json:"email"`
    Message string `json:"message"`
}
type contactResponse struct { ID int64 `json:"id"` }
type contactErrors struct {
    Error string `json:"error"`
    Fields map[string]string `json:"fields"`
}

func validateContact(in contactInput) (contactInput, map[string]string) {
    in.Name = strings.TrimSpace(in.Name)
    in.Email = normalizeEmail(in.Email)
    in.Message = strings.TrimSpace(in.Message)
    fields := map[string]string{}
    if utf8.RuneCountInString(in.Name) < 1 || utf8.RuneCountInString(in.Name) > 100 { fields["name"] = "Enter your name (up to 100 characters)." }
    if !validEmail(in.Email) { fields["email"] = "Enter a valid email address." }
    if utf8.RuneCountInString(in.Message) < 1 || utf8.RuneCountInString(in.Message) > 5000 { fields["message"] = "Enter a message (up to 5,000 characters)." }
    return in, fields
}

func (s *Server) handleContact(w http.ResponseWriter, r *http.Request) {
    var in contactInput
    if err := decodeJSON(r, &in); err != nil {
        writeJSON(w, http.StatusBadRequest, contactErrors{Error:"invalid_body", Fields:map[string]string{"message":"Please check your message and try again."}}); return
    }
    in, fields := validateContact(in)
    if len(fields) > 0 { writeJSON(w, http.StatusBadRequest, contactErrors{Error:"validation_failed", Fields:fields}); return }
    var userID any
    if u, ok := s.currentUser(r); ok { userID = u.ID }
    var out contactResponse
    if err := s.pool.QueryRow(r.Context(), `INSERT INTO contact_messages(user_id,name,email,message) VALUES($1,$2,$3,$4) RETURNING id`, userID,in.Name,in.Email,in.Message).Scan(&out.ID); err != nil {
        serverError(w, r, "contact_failed", err); return
    }
    writeJSON(w, http.StatusCreated, out)
}
