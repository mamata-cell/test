import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button, GoogleButton } from "@/ui";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";

export function Home() {
  const { user } = useAuth();
  return (
    <div className="public-page">
      <PublicHeader />
      <main id="main-content" className="site-container">
        <section className="home-arrival" aria-labelledby="arrival-title">
          <div className="introduction">
            <h1 id="arrival-title">A clear place to begin.</h1>
            <p>Create your Clearline account, return when you need it, and get in touch when you have a question.</p>
          </div>
          <div className="account-access">
            <h2>Your account, within reach.</h2>
            {user ? <><Button asChild className="primary-action"><Link to="/account">Open your account <ArrowUpRight size={18} /></Link></Button><p className="supporting">Signed in as {user.email}</p></> : <><GoogleButton label="Continue with Google" className="google-primary" /><Link className="text-link" to="/sign-in">Use email instead <ArrowUpRight size={16} /></Link><p className="supporting">Already signed in? <Link to="/account">Open your account.</Link></p></>}
          </div>
        </section>
        <section className="nameplate" aria-label="Clearline"><p>Clearline</p></section>
        <section className="home-help"><p>Need a hand getting started?</p><Link className="text-link" to="/contact">Contact us <ArrowUpRight size={18} /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}
