import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, CardHeader, CardContent, CardFooter, Input, Label } from "../ui";

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
  const { login, register } = useAuth();
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
      navigate("/dashboard");
    } catch (err) {
      setError(messageFor(err, mode));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <Card>
        <CardHeader>
        <h1 style={{ marginBottom: 4 }}>{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="text-muted-foreground text-sm">
          {mode === "login" ? "Welcome back." : "Get started with a new account."}
        </p>
        </CardHeader>
        <CardContent>
        <form id="auth-form" onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          {mode === "register" && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Need an account? Create one" : "Have an account? Sign in"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function messageFor(err: unknown, mode: "login" | "register"): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Wrong email or password.";
    if (err.status === 409) return "That email is already registered.";
    if (err.status === 400) return "Enter a valid email and a password of at least 8 characters.";
  }
  return mode === "login" ? "Could not sign in. Try again." : "Could not create account. Try again.";
}
