import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button, GoogleButton } from "@/ui";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";

export function Home() {
  const { user } = useAuth();
  return (
    <div data-lg-key="014cd16127" className="public-page">
      <PublicHeader />
      <main data-lg-key="c29e87a0be" id="main-content" className="site-container">
        <section data-lg-key="0730f658a7" className="home-arrival" aria-labelledby="arrival-title">
          <div data-lg-key="d8f04145af" className="introduction">
            <h1 data-lg-key="2cfd22a280" id="arrival-title">Your account. Without the fuss.</h1>
            <p data-lg-key="7449a9e1db">Create your Clearline account, return when you need it, and get in touch when you have a question.</p>
          </div>
          <div data-lg-key="c2cd1e4c80" className="account-access">
            <h2 data-lg-key="6adc160fd5">Your account, within reach.</h2>
            {user ? <><Button asChild className="primary-action"><Link to="/account">Open your account <ArrowUpRight size={18} /></Link></Button><p data-lg-key="ce5433e184" className="supporting">Signed in as {user.email}</p></> : <><GoogleButton label="Continue with Google" className="google-primary" /><Link className="text-link" to="/sign-in">Use email instead <ArrowUpRight size={16} /></Link><p data-lg-key="b82df7eee8" className="supporting">Already signed in? <Link to="/account">Open your account.</Link></p></>}
          </div>
        </section>
        <section data-lg-key="d367bac405" className="nameplate" aria-label="Clearline"><p data-lg-key="5e0b6c5081">Clearline</p></section>
        <section data-lg-key="fffdb5b4f7" className="home-help"><p data-lg-key="39c8b06921">Need a hand getting started?</p><Link className="text-link" to="/contact">Contact us <ArrowUpRight size={18} /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}
