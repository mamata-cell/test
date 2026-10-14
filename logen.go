package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// LogenAuth is the thin client for Logen's tenant Google OAuth proxy — the one
// platform service a generated app talks to. Logen brokers Google sign-in, so this
// app never handles an OAuth client secret. Flow:
//
//  1. Browser hits GET /api/auth/google/login -> we 302 to LoginURL (Logen).
//  2. Logen runs Google OAuth, then redirects the browser back to our callback with
//     ?session_id=... (a short-lived, single-use handshake token).
//  3. Our callback calls Exchange(session_id) server-to-server -> the user's profile.
//  4. We upsert a row in OUR users table and start OUR OWN session, exactly as
//     handleLogin does — so a Google user and a password user are the same kind of
//     user and requireUser works for both without a branch.
//
// Step 4 is the important one: Logen's own session token is NOT kept. It identifies
// the person once; the sessions table carries them after that.
type LogenAuth struct {
	cfg  Config
	http *http.Client
}

// LogenProfile is the user identity Logen returns from the exchange.
type LogenProfile struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
	GoogleID string `json:"google_id"`
}

func NewLogenAuth(cfg Config) *LogenAuth {
	return &LogenAuth{cfg: cfg, http: &http.Client{Timeout: 10 * time.Second}}
}

// Configured reports whether this app is wired to the proxy (it always is in a deploy).
func (l *LogenAuth) Configured() bool {
	return l.cfg.AppUUID != "" && l.cfg.LogenBaseURL != ""
}

// LoginURL is the browser redirect that starts sign-in. `callback` must be an
// ABSOLUTE URL on this app's public origin — Logen validates the host against the
// app's preview, published, and custom domains, and refuses anything else.
func (l *LogenAuth) LoginURL(callback string) string {
	q := url.Values{}
	q.Set("tenant_id", l.cfg.AppUUID)
	q.Set("redirect_uri", callback)
	return fmt.Sprintf("%s/auth/tenant/google?%s", l.cfg.LogenBaseURL, q.Encode())
}

// Exchange trades the callback's short-lived session_id for the signed-in user's
// profile (server-to-server).
func (l *LogenAuth) Exchange(ctx context.Context, sessionID string) (LogenProfile, error) {
	body, err := json.Marshal(map[string]string{
		"session_id": sessionID,
		"tenant_id":  l.cfg.AppUUID,
	})
	if err != nil {
		return LogenProfile{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		l.cfg.LogenInternalURL+"/api/auth/tenant/exchange", bytes.NewReader(body))
	if err != nil {
		return LogenProfile{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := l.http.Do(req)
	if err != nil {
		return LogenProfile{}, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return LogenProfile{}, fmt.Errorf("exchange: status %d", res.StatusCode)
	}

	var out struct {
		User LogenProfile `json:"user"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return LogenProfile{}, err
	}
	if out.User.Email == "" {
		return LogenProfile{}, fmt.Errorf("exchange: no user email")
	}
	return out.User, nil
}

// publicOrigin is this app's origin as the BROWSER sees it. Logen injects
// LOGEN_APP_ORIGIN with the exact host it routes to, so prefer that: it is
// deterministic and cannot be corrupted by the proxy chain. Header derivation stays
// as the fallback for a container started without the var (and r.Host last, since the
// container sits behind Caddy and the Vite front door, so r.Host is the internal one).
func publicOrigin(r *http.Request) string {
	if origin := strings.TrimRight(os.Getenv("LOGEN_APP_ORIGIN"), "/"); origin != "" {
		return origin
	}
	proto := firstForwarded(r.Header.Get("X-Forwarded-Proto"))
	if proto == "" {
		proto = "https"
	}
	host := firstForwarded(r.Header.Get("X-Forwarded-Host"))
	if host == "" {
		host = r.Host
	}
	return proto + "://" + host
}

// firstForwarded returns the LEFT-MOST value of an X-Forwarded-* header.
//
// Two proxies sit in front of this container (the edge, then the app's own front
// door) and each APPENDS its own view, so the header arrives comma-joined —
// "https,http". Taking it whole produced the origin "https,http://host", and the
// resulting OAuth callback URL has no parseable scheme, so Logen's proxy rejected
// it as an invalid redirect_uri and Google sign-in failed every time.
//
// Per RFC 7239 the left-most entry is the one the BROWSER actually used, which is
// exactly what an externally-reachable callback URL needs.
//
// In THIS topology only Proto actually arrives as a list (the Vite front door sets
// X-Forwarded-Host only when absent, but appends Proto). Host goes through the same
// helper defensively — a future front door that appends it would break the callback
// the same way, and stripping a list that never appears costs nothing.
func firstForwarded(v string) string {
	if i := strings.IndexByte(v, ','); i >= 0 {
		v = v[:i]
	}
	return strings.TrimSpace(v)
}
