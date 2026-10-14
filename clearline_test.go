package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
    "os"
    "strings"
    "testing"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

func TestContactValidation(t *testing.T) {
    clean, fields := validateContact(contactInput{Name:"  Ada  ", Email:"ADA@example.test", Message:" Hello "})
    if len(fields) != 0 || clean.Name != "Ada" || clean.Email != "ada@example.test" || clean.Message != "Hello" { t.Fatal("valid contact was not normalized") }
    _, fields = validateContact(contactInput{Name:" ", Email:"wrong", Message:" "})
    if len(fields) != 3 { t.Fatal("all invalid fields need guidance") }
    _, fields = validateContact(contactInput{Name:"Ada", Email:"ada@example.test", Message:strings.Repeat("a",5001)})
    if fields["message"] == "" { t.Fatal("message limit missing") }
}

func TestMutationGuard(t *testing.T) {
    called := false
    handler := mutationGuard("test-origin", 10, http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){called=true;w.WriteHeader(204)}))
    r := httptest.NewRequest("POST","https://app.test/api/contact",strings.NewReader(`{}`))
    r.Header.Set("Content-Type","application/json")
    r.Header.Set("Origin","https://evil.test")
    w := httptest.NewRecorder(); handler.ServeHTTP(w,r)
    if w.Code != 403 || called { t.Fatal("foreign origin was not rejected") }
}

// Use an isolated schema, so this check neither seeds nor mutates preview content.
func TestPrimaryPaths(t *testing.T) {
    database := os.Getenv("DATABASE_URL")
    if database == "" { t.Skip("DATABASE_URL unavailable; persistence not checked") }
    ctx, cancel := context.WithTimeout(context.Background(),60*time.Second); defer cancel()
    root, err := pgxpool.New(ctx,database); if err != nil { t.Fatal(err) }; defer root.Close()
    schema := fmt.Sprintf("clearline_check_%d", time.Now().UnixNano())
    if _, err = root.Exec(ctx,"CREATE SCHEMA "+schema); err != nil { t.Fatal(err) }
    defer root.Exec(context.Background(),"DROP SCHEMA "+schema+" CASCADE")
    config,err := pgxpool.ParseConfig(database); if err != nil { t.Fatal(err) }
    config.ConnConfig.RuntimeParams["search_path"] = schema
    pool,err := pgxpool.NewWithConfig(ctx,config); if err != nil { t.Fatal(err) }; defer pool.Close()
    if err=runMigrations(ctx,pool);err != nil { t.Fatal(err) }
    if err=runMigrations(ctx,pool);err != nil { t.Fatal("migrations were not idempotent",err) }
    s := NewServer(Config{},pool)
    mux := http.NewServeMux(); s.routes(mux)
    request := func(method,path,body string,cookie *http.Cookie) *httptest.ResponseRecorder {
        r:=httptest.NewRequest(method,"https://app.test"+path,strings.NewReader(body))
        r.Header.Set("Content-Type","application/json")
        if cookie != nil { r.AddCookie(cookie) }
        w:=httptest.NewRecorder();mux.ServeHTTP(w,r);return w
    }
    credentials := `{"name":"Path check","email":"path@example.test","password":"a-long-test-password"}`
    w := request("POST","/api/auth/register",credentials,nil)
    if w.Code != 200 { t.Fatalf("registration: %d %s",w.Code,w.Body.String()) }
    cookies:=w.Result().Cookies(); if len(cookies)==0 {t.Fatal("session cookie missing")};cookie:=cookies[0]
    if !cookie.Secure || !cookie.HttpOnly || cookie.SameSite != http.SameSiteLaxMode { t.Fatal("cookie security missing") }
    var rawStored int
    if err=pool.QueryRow(ctx,`SELECT count(*) FROM sessions WHERE token=$1`,cookie.Value).Scan(&rawStored);err != nil || rawStored != 0 {t.Fatal("raw session token persisted")}
    w=request("GET","/api/auth/session","",cookie)
    var session struct{User User `json:"user"`};json.Unmarshal(w.Body.Bytes(),&session)
    if w.Code!=200 || session.User.Email!="path@example.test" || session.User.Role!="user" { t.Fatal("incorrect session identity") }
    if w=request("GET","/api/account","",nil);w.Code!=401 {t.Fatal("account exposed without auth")}
    if w=request("GET","/api/account","",cookie);w.Code!=200 {t.Fatal("new empty account failed")}
    if w=request("POST","/api/contact",`{"name":"Visitor","email":"visitor@example.test","message":"Guest message"}`,nil);w.Code!=201 {t.Fatal("guest contact failed",w.Body.String())}
    if w=request("POST","/api/contact",`{"name":"Member","email":"path@example.test","message":"Member message"}`,cookie);w.Code!=201 {t.Fatal("member contact failed")}
    if w=request("POST","/api/contact",`{"name":"","email":"invalid","message":""}`,nil);w.Code!=400 {t.Fatal("invalid contact accepted")}
    var total,owned int
    if err=pool.QueryRow(ctx,`SELECT count(*),count(user_id) FROM contact_messages`).Scan(&total,&owned);err!=nil || total!=2 || owned!=1 {t.Fatal("contact persistence or ownership failed")}
    if w=request("POST","/api/auth/logout",`{}`,cookie);w.Code!=204 {t.Fatal("logout failed")}
    if w=request("GET","/api/account","",cookie);w.Code!=401 {t.Fatal("session not revoked")}
    if w=request("POST","/api/auth/login",credentials,nil);w.Code!=200 {t.Fatal("sign-in after logout failed")}
    if w=request("POST","/api/auth/login",`{"email":"path@example.test","password":"wrong"}`,nil);w.Code!=401 {t.Fatal("bad credentials accepted")}
    if w=request("GET","/api/auth/google/callback?session_id=invalid","",nil);w.Code!=302 || !strings.Contains(w.Header().Get("Location"),"invalid_state") {t.Fatal("unbound OAuth callback accepted")}
    googleProfile := LogenProfile{Email:"google@example.test",Name:"Google user",GoogleID:"verified-subject"}
    first,err:=s.upsertGoogleUser(ctx,googleProfile);if err!=nil {t.Fatal(err)}
    second,err:=s.upsertGoogleUser(ctx,googleProfile);if err!=nil || first.ID!=second.ID {t.Fatal("Google identity not stable")}
    _,err=s.upsertGoogleUser(ctx,LogenProfile{Email:"path@example.test",Name:"Conflict",GoogleID:"another-subject"})
    if err!=errGoogleEmailConflict {t.Fatal("email-only identity merge accepted")}
}
