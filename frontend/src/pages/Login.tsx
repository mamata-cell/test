import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { Button, GoogleButton, Input, Label } from "@/ui";
import { toast } from "sonner";

// Combined sign-in / create-account form. Email + password.
//
// Google sign-in is ALSO supported by this backend (/api/auth/google/login) and ends
// in the SAME session cookie and user record — but it is NOT rendered here, because
// Logen's proxy refuses an app whose `google_auth_enabled` flag is off (the default),
// so a button shipped by default would dead-end on an error page. To add it: call
// `tool__enable_google_auth`, then render `<GoogleButton />` from `../ui` below the
// form, with a divider above it, e.g.
// `<div className="text-muted-foreground my-4 text-center text-xs">or</div>`.
// GoogleButton is full-width and carries its own .btn-google styling (kept as plain
// CSS in index.css so a Tailwind restyle cannot drift it off Google's brand rules).
export function Login() {
  const { user, loading, login, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
      toast.success(mode === "login" ? "You’re signed in." : "Your account is ready.");
      navigate("/account", { replace: true });
    } catch (err) {
      setError(messageFor(err, mode));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main data-lg-key="8faaa796a9" className="site-container auth-page"><p data-lg-key="4f7400bc00" role="status">Checking your session…</p></main>;
  if (user) return <Navigate to="/account" replace />;
  const oauthError = params.get("auth_error");
  return (
    <main data-lg-key="1229a622a2" className="site-container auth-page" id="main-content">
      <Link className="text-link" to="/">← Back to Home</Link>
      <div data-lg-key="44ef4aa1d5" className="auth-column">
        <h1 data-lg-key="27ca0186a8">{mode === "login" ? "Sign in to Clearline." : "Create your account."}</h1>
        <p data-lg-key="79a508d95a" className="supporting">{mode === "login" ? "Your account, within reach." : "A clear place to begin."}</p>
        {oauthError && <p data-lg-key="ae13b384e2" className="form-error" role="alert">{oauthError === "email_conflict" ? "Please sign in with email and password for your existing account." : "Google sign-in didn’t complete. Please try again or use email instead."}</p>}
        <div data-lg-key="a95edbf379" className="auth-divider"><span data-lg-key="91fb68946d">or</span></div>
        <GoogleButton label="Continue with Google" className="auth-google-full" />
        <form data-lg-key="836f89edee" id="auth-form" onSubmit={onSubmit} className="clearline-form" aria-busy={busy}>
          {mode === "register" && (
            <div data-lg-key="08d98c3646" className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
            </div>
          )}
          <div data-lg-key="1a5168b079" className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              disabled={busy}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div data-lg-key="d0f8cecd42" className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              disabled={busy}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-hint auth-error"
            />
            <p data-lg-key="bc7762b3c3" id="password-hint" className="supporting">At least 8 characters.</p>
          </div>
          {error && <p data-lg-key="c738c26a9e" id="auth-error" className="form-error" role="alert">{error}</p>}
          <Button className="primary-action" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
          <Button
            variant="link"
            className="auth-mode"
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Create an account" : "Have an account? Sign in"}
          </Button>
      </div>
    </main>
  );
}

function messageFor(err: unknown, mode: "login" | "register"): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Wrong email or password.";
    if (err.status === 409) return "Could not create this account. Try signing in instead.";
    if (err.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
    if (err.status === 400) return "Enter a valid email and a password of at least 8 characters.";
  }
  return mode === "login" ? "Could not sign in. Try again." : "Could not create account. Try again.";
}
