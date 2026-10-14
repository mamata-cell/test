import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { AppShell, Button } from "@/ui";
import { toast } from "sonner";

export function Layout() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      await refresh();
      toast.success("You’re signed out.");
      navigate("/", { replace: true });
    } catch { toast.error("Could not sign out. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <AppShell pattern="topbar-main" variant="inset" className="account-shell" topbar={<div className="site-container account-topbar"><Link className="wordmark" to="/">Clearline<span>.</span></Link><Link className="account-current" to="/account" aria-current="page">Account</Link><nav aria-label="Account navigation"><Link className="text-link" to="/contact">Contact</Link><Button variant="secondary" className="sign-out" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</Button></nav></div>}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Outlet />
    </AppShell>
  );
}

