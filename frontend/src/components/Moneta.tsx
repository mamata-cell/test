import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../moneta.css";

export function MonetaAction({to, children, secondary = false, className = ""}: {to: string; children: ReactNode; secondary?: boolean; className?: string}) {
  return <Link className={`button${secondary ? " secondary" : ""}${className ? ` ${className}` : ""}`} to={to}>{children} <span aria-hidden="true">↗</span></Link>;
}

export function MonetaLayout({title, children}: {title: string; children: ReactNode}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    document.title = `Fintech Moneta · ${title}`;
    window.scrollTo(0, 0);
  }, [pathname, title]);
  return <div className="moneta-site">
    <a className="moneta-skip" href="#main-content">Skip to content</a>
    <div className="announcement">A clearer perspective on business money</div>
    <div className="wrap">
      <header className="site-header">
        <Link className="brand" to="/"><em>◈</em> Moneta</Link>
        <nav aria-label="Main navigation"><NavLink to="/accounts">Accounts</NavLink><NavLink to="/cards">Cards</NavLink><NavLink to="/company">Company</NavLink></nav>
        <MonetaAction className="header-cta" to="/accounts">Explore</MonetaAction>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <Link className="brand" to="/">Moneta</Link>
        <span>Original static design template · All content is illustrative.</span>
        <div className="footer-links"><Link to="/accounts">Accounts</Link><Link to="/cards">Cards</Link><Link to="/contact">Contact</Link><Link to={user ? "/account" : "/sign-in"}>{user ? "Account" : "Sign in"}</Link></div>
      </footer>
    </div>
  </div>;
}

export function MonetaDashboard() {
  return <div className="dashboard">
    <div className="dash-top"><b>◈ Moneta business</b><span className="pill">Overview</span></div>
    <div className="dash-label">TOTAL BALANCE · SAMPLE DATA</div>
    <div className="dash-metric">$24,860.00</div>
    <div className="mini-label"><span>Your money, clearly organized</span><span>USD</span></div>
    <div className="bars" role="img" aria-label="Illustrative monthly cash flow">
      {[32,48,42,68,55,77,69,92,84,100].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}
    </div>
    <div className="dash-row"><span>Studio subscription<br /><small>Software · Today</small></span><b>−$29.00</b></div>
    <div className="dash-row"><span>Client invoice<br /><small>Income · Yesterday</small></span><b>+$2,400.00</b></div>
    <div className="fine">Interface concept · no real financial account</div>
  </div>;
}

type MonetaCard = {icon: string; title: string; description: string; to: string; label: string};
export function MonetaCards({title, items}: {title: string; items: MonetaCard[]}) {
  return <section className="section"><div className="section-head"><h2>{title}</h2></div><div className="grid">
    {items.map(item=><article key={item.title} className="card"><div className="card-icon" aria-hidden="true">{item.icon}</div><h3>{item.title}</h3><p>{item.description}</p><Link className="text-link" to={item.to}>{item.label} →</Link></article>)}
  </div></section>;
}

export function MonetaBanner({title, description, to, label}: {title: string; description: string; to: string; label: string}) {
  return <section className="section"><div className="banner"><div><h2>{title}</h2><p>{description}</p></div><MonetaAction to={to}>{label}</MonetaAction></div></section>;
}
