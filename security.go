package main

import (
    "net"
    "net/http"
    "strings"
    "sync"
    "time"
)

type rateBucket struct { count int; expires time.Time }
var requestRates = struct { sync.Mutex; buckets map[string]rateBucket }{buckets: make(map[string]rateBucket)}

func allowRequest(r *http.Request, action string, limit int) bool {
    ip := firstForwarded(r.Header.Get("X-Forwarded-For"))
    if ip == "" { ip, _, _ = net.SplitHostPort(r.RemoteAddr) }
    key := action + ":" + ip
    now := time.Now()
    requestRates.Lock()
    defer requestRates.Unlock()
    for k, b := range requestRates.buckets { if now.After(b.expires) { delete(requestRates.buckets, k) } }
    b := requestRates.buckets[key]
    if b.expires.IsZero() { b.expires = now.Add(10*time.Minute) }
    if b.count >= limit { return false }
    b.count++
    requestRates.buckets[key] = b
    return true
}

func mutationGuard(action string, limit int, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := strings.TrimRight(r.Header.Get("Origin"), "/")
        if (origin != "" && origin != publicOrigin(r)) || r.Header.Get("Sec-Fetch-Site") == "cross-site" {
            writeJSON(w, http.StatusForbidden, map[string]string{"error":"origin_rejected"}); return
        }
        if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
            writeJSON(w, http.StatusUnsupportedMediaType, map[string]string{"error":"json_required"}); return
        }
        if !allowRequest(r, action, limit) {
            w.Header().Set("Retry-After", "600")
            writeJSON(w, http.StatusTooManyRequests, map[string]string{"error":"too_many_requests"}); return
        }
        r.Body = http.MaxBytesReader(w, r.Body, 32768)
        next.ServeHTTP(w, r)
    })
}
