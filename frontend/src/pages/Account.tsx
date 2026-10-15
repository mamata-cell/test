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
  return <div data-lg-key="955888087e" className="site-container account-content" id="main-content">
    <PageHeader title="Your account." />
    {error ? <div data-lg-key="eaaadd15b6" role="alert"><p data-lg-key="e737af969f">Could not load your account.</p><Button variant="outline" onClick={() => setAttempt(a=>a+1)}>Try again</Button></div> : !data ? <p data-lg-key="d0b30c292a" role="status" className="supporting">Loading your account…</p> : <>
      <dl data-lg-key="6fdc1b9b90" className="account-details"><div data-lg-key="ea0e94566b"><dt data-lg-key="ef89dcc193">Name</dt><dd data-lg-key="c7c6323aa2">{data.user.name || "Not provided"}</dd></div><div data-lg-key="a3c533285a"><dt data-lg-key="38997926eb">Email</dt><dd data-lg-key="28fb1f5712">{data.user.email}</dd></div><div data-lg-key="ac729c030d"><dt data-lg-key="e68e63bc07">Sign-in method</dt><dd data-lg-key="2b9924df92">{data.sign_in_method}</dd></div></dl>
      <section data-lg-key="4fdecec4ac" className="account-status"><h2 data-lg-key="7fb1980fdb">You’re signed in.</h2><p data-lg-key="2283bf2adf">Your account is ready. If you need help, get in touch.</p><Link className="text-link" to="/contact">Contact us</Link></section>
    </>}
  </div>;
}
