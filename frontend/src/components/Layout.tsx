import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import appIdentity from "../app-name.json";
import { api } from "../lib/api";
import { Badge, Button } from "../ui";

export function Layout() {
  const { user, loading, logout } = useAuth();
  const unread = useUnreadCount();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <Link to="/" className="font-semibold tracking-tight">
            {appIdentity.name}
          </Link>
          <nav className="text-muted-foreground flex items-center gap-5 text-sm">
            <Link className="hover:text-foreground transition-colors" to="/">
              Home
            </Link>
            {user && (
              <Link className="hover:text-foreground transition-colors" to="/dashboard">
                Dashboard
              </Link>
            )}
            {user && (
              <Link className="hover:text-foreground transition-colors" to="/uploads">
                Files
              </Link>
            )}
            {user && (
              <Link
                className="hover:text-foreground flex items-center gap-2 transition-colors"
                to="/notifications"
              >
                Notifications
                {unread > 0 && <Badge variant="info">{unread}</Badge>}
              </Link>
            )}
          {/* Sign-OUT only. There is deliberately no sign-IN control: auth ships
              embedded but DORMANT, so an app that never asked for accounts shows no
              login entry point at all. Activating auth is what adds one back. */}
            {!loading && user && (
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                Sign out
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

// Unread badge for the nav. Re-fetched on navigation, so marking things read on
// the notifications page updates the count as soon as you leave it.
function useUnreadCount(): number {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    api<{ unread: number }>("/api/notifications/unread-count")
      .then((d) => setUnread(d.unread))
      .catch(() => setUnread(0));
  }, [user, pathname]);

  return unread;
}
