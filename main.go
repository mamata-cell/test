// Go API for the go-react starter. It listens on loopback only (API_PORT) and is
// never exposed directly — the Vite dev server (the container's front door)
// proxies /api here. One container, two processes.
//
// On boot it connects to Postgres (DATABASE_URL, injected by Logen), applies
// embedded migrations, then serves the API + the Logen auth endpoints.
package main

import (
	"context"
	"log"
	"net/http"
)

func main() {
	cfg := LoadConfig()
	ctx := context.Background()

	pool, err := connectDB(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[go-api] database: %v", err)
	}
	defer pool.Close()

	if err := runMigrations(ctx, pool); err != nil {
		log.Fatalf("[go-api] migrations: %v", err)
	}

	if err := ensureUploadDir(cfg.UploadDir); err != nil {
		log.Fatalf("[go-api] upload dir: %v", err)
	}

	srv := NewServer(cfg, pool)
	mux := http.NewServeMux()
	srv.routes(mux)

	addr := "127.0.0.1:" + cfg.APIPort
	log.Printf("[go-api] listening on %s", addr)
	if err := http.ListenAndServe(addr, recoverMW(logMW(mux))); err != nil {
		log.Fatalf("[go-api] %v", err)
	}
}
