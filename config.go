package main

import "os"

// Config holds the environment-derived settings. Logen injects DATABASE_URL, the
// port vars, and the identity vars below into the container.
type Config struct {
	APIPort     string // API_PORT — loopback port the Go server binds
	DatabaseURL string // DATABASE_URL — postgres://… (pgx)

	// UPLOAD_DIR — local directory the upload feature writes to (see uploads.go).
	// Created at boot if missing and kept out of git.
	UploadDir string

	// Identity for Logen's Google sign-in proxy (see logen.go). AppUUID names this
	// app to Logen; LogenBaseURL is where the BROWSER is sent; LogenInternalURL is
	// reachable from inside the container for the server-to-server exchange.
	AppUUID          string // LOGEN_APP_UUID
	LogenBaseURL     string // LOGEN_BASE_URL
	LogenInternalURL string // LOGEN_INTERNAL_BASE_URL
}

func LoadConfig() Config {
	base := os.Getenv("LOGEN_BASE_URL")
	return Config{
		APIPort:     getenv("API_PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		UploadDir:   getenv("UPLOAD_DIR", "uploads"),

		AppUUID:      os.Getenv("LOGEN_APP_UUID"),
		LogenBaseURL: base,
		// Falls back to the public URL: the exchange still works over the internet
		// if the internal address is unset, just with an extra hop.
		LogenInternalURL: getenv("LOGEN_INTERNAL_BASE_URL", base),
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
