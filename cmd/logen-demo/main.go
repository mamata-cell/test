// Private seed hook, not an HTTP endpoint. Credentials are supplied by Logen
// at runtime; never embed demo passwords in source or production migrations.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type account struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func seed() error {
	environment := os.Getenv("LOGEN_ENVIRONMENT")
	if environment != "preview" && environment != "verification" {
		return errors.New("demo environment refused")
	}
	data, err := os.ReadFile(os.Getenv("LOGEN_DEMO_ACCOUNTS_FILE"))
	if err != nil {
		return errors.New("demo input unavailable")
	}
	var input struct {
		Version  int       `json:"version"`
		Accounts []account `json:"accounts"`
	}
	if len(data) > 16384 || json.Unmarshal(data, &input) != nil || input.Version != 1 || len(input.Accounts) > 4 {
		return errors.New("invalid demo input")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return errors.New("demo database unavailable")
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		return errors.New("demo transaction unavailable")
	}
	defer tx.Rollback(ctx)
	seen := map[string]bool{}
	for _, a := range input.Accounts {
		if a.Email == "" || a.Email != strings.ToLower(a.Email) || !strings.Contains(a.Email, "@") ||
			len(a.Password) < 8 || len(a.Password) > 72 || seen[a.Email] || (a.Role != "user" && a.Role != "admin") {
			return errors.New("invalid demo identity")
		}
		seen[a.Email] = true
		hash, err := bcrypt.GenerateFromPassword([]byte(a.Password), bcrypt.DefaultCost)
		if err != nil {
			return errors.New("demo password hashing failed")
		}
		result, err := tx.Exec(ctx, `INSERT INTO users(email,name,password_hash,role,logen_demo_account)
            VALUES($1,'Demo user',$2,$3,true)
            ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,
                role=EXCLUDED.role, updated_at=now()
            WHERE users.logen_demo_account = true`, a.Email, string(hash), a.Role)
		if err != nil || result.RowsAffected() != 1 {
			return errors.New("demo identity conflicts with existing user or schema")
		}
		// Add app-specific owned fixtures here, keyed by this declared identity.
		// Keep them idempotent and in this transaction, not production seeds.
	}
	return tx.Commit(ctx)
}

func main() {
	if seed() != nil {
		fmt.Fprintln(os.Stderr, "Demo seed failed; check hook/schema compatibility")
		os.Exit(1)
	}
}
