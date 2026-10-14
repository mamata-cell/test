import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { type User } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import { Button, PageHeader } from "@/ui";

type AccountResponse = { user: User & {role: string}; sign_in_method: string };
export function Account() {
  const [data, setData] = useState<AccountResponse | null>(null);
  const [error, setError] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    api<AccountResponse>("/api/account").then(d => { if (active) setData(d); }).catch(e => { if (active) { if (e instanceof ApiError && e.status === 401) setSignedOut(true); else setError(true); } });
    return () => { active = false; };
  }, [attempt]);
  if (signedOut) return <Navigate to="/sign-in" replace />;
  return <div className="site-container account-content" id="main-content">
    <PageHeader title="Your account." />
    {error ? <div role="alert"><p>Could not load your account.</p><Button variant="outline" onClick={() => setAttempt(a=>a+1)}>Try again</Button></div> : !data ? <p role="status" className="supporting">Loading your account…</p> : <>
      <dl className="account-details"><div><dt>Name</dt><dd>{data.user.name || "Not provided"}</dd></div><div><dt>Email</dt><dd>{data.user.email}</dd></div><div><dt>Sign-in method</dt><dd>{data.sign_in_method}</dd></div></dl>
      <section className="account-status"><h2>You’re signed in.</h2><p>Your account is ready. If you need help, get in touch.</p><Link className="text-link" to="/contact">Contact us</Link></section>
    </>}
  </div>;
}
