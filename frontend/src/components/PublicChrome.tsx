import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function PublicHeader() {
  const { user } = useAuth();
  return <>
    <a data-lg-key="6149cee067" className="skip-link" href="#main-content">Skip to content</a>
    <header data-lg-key="4acd519e08" className="site-container public-header">
      <Link className="wordmark" to="/" aria-label="Moneta home">◈ Moneta</Link>
      <nav data-lg-key="883b4e7a9e" aria-label="Main navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/contact">Contact</NavLink></nav>
      <Link className="account-link" to={user ? "/account" : "/sign-in"}>{user ? "Account" : "Sign in"}</Link>
    </header>
  </>;
}

export function PublicFooter() {
  return <footer data-lg-key="35ea2feabd" className="site-container public-footer"><span data-lg-key="41ee36ef5f">Moneta <span data-lg-key="6025196a99" className="footer-year">© {new Date().getFullYear()}</span></span><nav data-lg-key="60f45b8684" aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/contact">Contact</Link></nav></footer>;
}
