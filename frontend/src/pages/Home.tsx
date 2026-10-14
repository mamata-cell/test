import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../ui";

// Auth-DORMANT, not auth-blind. Two constraints hold at once here:
//
//  1. An app that never asked for accounts must not ship a sign-in entry point.
//     Nothing below renders a "Sign in" link — when there is no user (which is
//     always, until auth is activated) this page is exactly the starter page it
//     was before.
//
//  2. A SIGNED-IN visitor must be able to tell, and get back into the app. The
//     post-login redirect lands on `/` (server.go), and this page renders OUTSIDE
//     <Layout>, so it is the only thing that can show that state — without the
//     `useAuth()` read below, signing in and not signing in look identical and
//     the user is left on a marketing page with no way forward. Measured on app
//     722: sign-in succeeded, a real session was issued, and the user reported it
//     as broken because nothing on screen changed.
//
// Rebuilding this page? Keep the signed-in branch. Point it at whatever this app's
// primary signed-in surface actually is.
export function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="mx-auto grid max-w-6xl gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Building your app…</h1>
        <p className="text-muted-foreground">
          This page is a placeholder. Your app is still being built — it will replace this
          the moment the first screen is ready.
        </p>

        {user && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild>
              <Link to="/dashboard">Open the app</Link>
            </Button>
            <span className="text-muted-foreground text-sm">Signed in as {user.email}</span>
          </div>
        )}
      </main>
    </div>
  );
}
