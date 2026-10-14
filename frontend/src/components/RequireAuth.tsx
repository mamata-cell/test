import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Guards a route: shows nothing while auth is resolving, redirects to /login when
// the visitor isn't signed in, otherwise renders the protected content.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
