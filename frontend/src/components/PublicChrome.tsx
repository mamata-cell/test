import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function PublicHeader() {
  const { user } = useAuth();
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-container public-header">
      <Link className="wordmark" to="/" aria-label="Clearline home">Clearline<span aria-hidden="true">.</span></Link>
      <nav aria-label="Main navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/contact">Contact</NavLink></nav>
      <Link className="account-link" to={user ? "/account" : "/sign-in"}>{user ? "Account" : "Sign in"}</Link>
    </header>
  </>;
}

export function PublicFooter() {
  return <footer className="site-container public-footer"><span>Clearline <span className="footer-year">© {new Date().getFullYear()}</span></span><nav aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/contact">Contact</Link></nav></footer>;
}
