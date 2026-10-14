# Scaffold contract — go-react template

This workspace was cloned from Logen's golden go-react template:
a Go (chi/pgx) REST API backend with a React 18 + TypeScript + Vite frontend. Scaffold code is
platform-tested — build ON it, never rewrite it. An AI reviewer should treat
untouched scaffold code as trusted and review only what this build wrote or
changed.

## What the scaffold guarantees (embedded — DORMANT until activated)

- **shell** — `frontend/src/components/Layout.tsx` (header/nav/sign-out) as
  the react-router layout route + `RequireAuth.tsx` gating; register new pages
  INSIDE the layout route in `App.tsx` so they inherit the chrome. The chrome
  ships NO sign-IN control — an app without accounts never shows a login entry.
- **auth** — local email+password AND Google sign-in baked into the template. Enable via `tool__enable_google_auth` (flips the proxy
  flag; the wired code already exists). DORMANT until the user asks for accounts.
- **api client** — `frontend/src/lib/api.ts`: `api<T>(path, opts)`
  same-origin fetch with credentials + `ApiError`. ALWAYS call the backend
  through it with relative `/api/...` paths — never hardcode hosts/ports.
- **auth context** — `frontend/src/auth/AuthContext.tsx`:
  `useAuth() -> { user, loading, login, logout, refresh }`.
- **upload**, **notifications**, **ui_kit** — shipped dormant; activate instead of
  regenerating (`tool__list_embedded_features` for steps). The ui_kit is Tailwind v4
  + shadcn/ui: import every primitive from `@/ui` (source in
  `frontend/src/components/ui/`, owned by this app), including `<GoogleButton />`.
  READ `frontend/src/components/ui/KIT.md` before UI work — the full component
  inventory with variants and composition idioms (Dialog/Form/Table parts).
- DB wiring via `DATABASE_URL`, dev front door on :4000 proxying the backend
  API on :8080 — preconfigured; keep those ports.

## Conventions this repo follows

- New pages under `frontend/src/pages/`, routed inside the existing layout
  route; nav links added in `Layout.tsx`.
- Backend endpoints under `/api/...`; frontend never fetches cross-origin.
- Every 500 goes through `serverError(w, r, "code", err)` (in `http.go`) — never
  `writeJSON(w, http.StatusInternalServerError, ...)` directly. It logs the CAUSE
  server-side and returns only the generic code to the client. The same code is
  usually written at several call sites, so a response of `{"error":"query_failed"}`
  with nothing in the log cannot say which one fired — and neither can you, later,
  when asked to fix it.
- A 500 from your own endpoint is a BACKEND bug. Do not "fix" it by hardening the
  React component against the missing data: the page then renders empty and the
  failure becomes invisible, which is worse than the crash. Read the log line the
  helper wrote and fix the cause.
- `frontend/src/theme.css` — DO NOT EDIT. Tailwind v4 plumbing; `index.css` must
  keep its `@import "./theme.css"`. Restyle via the tokens in `index.css` instead.
- The landing page (`pages/Home.tsx`) renders standalone, outside `<Layout>`; only
  authenticated routes go inside the shell.
- Import UI primitives from `@/ui`; never hand-roll raw `<button>`/`<input>`/
  `<select>`/`<dialog>`. Restyle by editing the design tokens at the top of
  `frontend/src/index.css` — one edit restyles buttons, rings, charts and toasts
  together. Tailwind v4 is CSS-first: no tailwind.config.js, no postcss.config.js.
- Already installed, use them rather than rebuilding: `lucide-react` (icons — use
  them everywhere), `@dnd-kit/*` (drag & reorder), `recharts` via `ChartContainer`
  (charts), `react-hook-form` + `zod` (forms), `@tanstack/react-table` (sorting),
  `sonner` (toasts), `date-fns` (dates).

## Do not touch

- `frontend/src/lib/api.ts`, `AuthContext.tsx`, `RequireAuth.tsx` internals —
  extend around them, don't rewrite.
- `node_modules/`, build outputs, the dev-proxy config.
- Dormant feature code you are not activating (it must stay buildable).

## Demo identities

When authentication is activated, implement the declared `trd.demo_accounts`
through `.logen/seed-demo.sh` and `cmd/logen-demo/main.go`. The platform supplies
version-1 JSON at `LOGEN_DEMO_ACCOUNTS_FILE` only in preview/verification. Extend
the hook for minimal owned data and actual roles; never hardcode credentials or
put demo users in production seeds. Do not overwrite unmarked real users.
The platform checks login plus the session email/role from `/api/auth/me`.

<!-- scaffold-contract-end -->
