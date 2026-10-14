# PLAN.md — build contract (TRD)

Derived from the validated design plan — do NOT hand-edit; the platform
regenerates this file from the plan and the item ledger (audit = recompute).
Implement every acceptance item, then make one focused primary-path self-check.
Batch concrete blockers before final deployment; do not add speculative edge cases or polish audits.
Platform checks record execution evidence separately; implementation is not verification.
Historical review findings are retained for context, not an approval requirement.

## Summary

Clearline is a minimal account and contact hub for independent professionals who want straightforward access without an elaborate onboarding flow. Visitors read a short introduction, create an account or sign in with Google or email, and arrive at their account details. Visitors and members can send a contact message. The page’s single job is to make account access understandable and easy; it does not advertise an unbuilt productivity product.

## Data model

Use Postgres with database/sql and pgx on DATABASE_URL. users: UUID primary key, name text, normalized unique email text, nullable password_hash text, role text restricted to user, created_at and updated_at timestamptz. auth_identities: UUID primary key, user_id UUID foreign key, provider text, provider_subject text, unique(provider, provider_subject). sessions: UUID primary key, user_id UUID foreign key, unique token_hash text, expires_at timestamptz, created_at timestamptz. contact_messages: bigint identity primary key, nullable user_id UUID foreign key, name text, email text, message text, created_at timestamptz. OAuth state must be short-lived and bound to the initiating browser. Never store plaintext passwords or raw session tokens.

## Routes

- `/` (public) — Public landing page and account entry point.. UI: Explain Clearline briefly and offer Google access, email access and Contact.. Empty state: The complete landing renders without database content; a new visitor sees working sign-in and contact entry points.
- `/contact` (public) — Public contact form.. UI: Collect name, email and message, then confirm persistence.. Empty state: Show an empty labeled form; authenticated visitors may have name and email prefilled.
- `/sign-in` (public) — Google authentication and email sign-in or account creation.. UI: Provide Google access and an explicit email sign-in/account-creation mode.. Empty state: Show the sign-in form with a discoverable Create an account option; require no existing records.
- `/account` (user) — Authenticated account home.. UI: Show real account identity and provide Contact and Sign out.. Empty state: A newly created account sees its saved identity and the You’re signed in status without placeholder records.

## Acceptance items

- [~] `trd-1` — core — **implemented**
  - acceptance: With a fresh Postgres database, migrations apply successfully and each declared page path serves the React application rather than a missing-route response.
  - verify: check
  - steps: Create migrations/0001_accounts_and_contact.sql for the declared data model. Wire the Postgres connection in main.go and place account, session and contact persistence in Go packages under the repo root. Register relative /api routes in main.go and serve the Vite frontend with page-route fallback.
- [~] `trd-2` — User authentication — **implemented**
  - acceptance: A new email account can register, sign out and sign back in; /api/auth/session returns its correct email and user role while an unauthenticated account-data request returns 401.
  - verify: check
  - steps: Activate any existing Go authentication scaffold before adding new handlers. Implement POST /api/auth/register, POST /api/auth/login, GET /api/auth/session and POST /api/auth/logout in Go handlers with password hashing, validation, rate limiting and secure session cookies. Protect account data server-side and apply origin or CSRF checks to mutations.
- [~] `trd-3` — User authentication — **implemented**
  - acceptance: With Google credentials configured, completing Google sign-in creates or retrieves a persisted user and opens /account with the correct session; cancellation or invalid state leaves the visitor signed out with a recoverable message.
  - verify: self_check
  - steps: Implement GET /api/auth/google and GET /api/auth/google/callback in Go using configured Google client credentials and callback URL. Validate browser-bound state and provider identity, persist the Google identity and issue the same session type as email authentication. Do not silently merge identities solely by matching email; handle an existing email-account conflict with a clear sign-in instruction. Return a safe configuration error when Google credentials are absent.
- [~] `trd-4` — User authentication — **implemented**
  - acceptance: Running the seed twice in preview creates exactly one declared demo identity whose actual login reports member@demo.test and role user; execution outside preview or verification is refused.
  - verify: check
  - steps: Implement .logen/seed-demo.sh to read version-1 JSON from LOGEN_DEMO_ACCOUNTS_FILE and invoke the native Go account creation service through a Go seed command. Permit only preview and verification environments, seed the declared user idempotently and keep passwords out of source and production seeds. Verify the seeded identity through the real login and session endpoints.
- [~] `trd-5` — User authentication — **implemented**
  - acceptance: In the deployed React app, email creation, email sign-in, Google entry, account identity display and Sign out are usable, and a signed-out visitor cannot view /account identity data.
  - verify: self_check
  - steps: Create frontend/src/pages/SignIn.tsx and frontend/src/pages/Account.tsx, wire /sign-in and /account in frontend/src/App.tsx, and use shared primitives from @/ui. Connect Google navigation and email forms to /api/auth endpoints. Resolve session state before rendering protected account data, redirect signed-out visitors to /sign-in and clear client account state on logout.
- [~] `trd-6` — Landing page — **implemented**
  - acceptance: The deployed / page renders complete content for a visitor with zero records, and its Google, email, Contact and authenticated Account actions reach their intended destinations.
  - verify: self_check
  - steps: Create frontend/src/pages/Home.tsx, wire / in frontend/src/App.tsx and connect its actions to Google authentication, /sign-in and /contact. Make its authenticated account link depend on GET /api/auth/session. Apply the binding design plan and preset authority through frontend/src/index.css and shared @/ui primitives.
- [~] `trd-7` — core — **implemented**
  - acceptance: Both signed-out and signed-in visitors can save a valid contact message, while invalid input creates no record and exposes field-specific guidance.
  - verify: check
  - steps: Create frontend/src/pages/Contact.tsx and wire /contact in frontend/src/App.tsx. Implement POST /api/contact in Go handlers with server-side length and email validation, rate limiting and Postgres persistence. Associate the current user when present without requiring authentication; return success only after insertion succeeds.
- [~] `trd-8` — core — **implemented**
  - acceptance: Every declared page is usable at 360px width and by keyboard without horizontal overflow, inaccessible controls or an unresolved loading state.
  - verify: self_check
  - steps: Exercise all declared React routes at desktop and phone widths, including fresh-account, pending, error and success states. Check frontend/src/index.css and @/ui primitives for visible focus, reduced-motion behavior and readable controls; verify keyboard form submission and meaningful labels. Use React-compatible icons only if necessary, never framework-specific template constructs.

## Dormant scaffold features

Activate account persistence, email authentication, Google OAuth and sessions. Leave uploads, notifications, billing, organization management, administrative dashboards and other embedded scaffold modules dormant.

## Out of scope

Do not build a task manager, analytics dashboard, catalog, additional marketing pages, account editing, password-reset flow, inbox administration or email delivery for contact messages. Contact submission means database persistence, not an implied support-system integration. No generated imagery, video, scroll choreography or heavy motion library.

