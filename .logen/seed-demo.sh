#!/bin/sh
set -eu
case "${LOGEN_ENVIRONMENT:-}" in
  preview|verification) ;;
  *) echo "Demo seeding is forbidden in this environment" >&2; exit 1 ;;
esac
test -n "${LOGEN_DEMO_ACCOUNTS_FILE:-}"
cd /app
go run ./cmd/logen-demo
