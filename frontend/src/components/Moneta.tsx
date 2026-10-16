import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../moneta.css";

export function MonetaAction({to, children, secondary = false, className = ""}: {to: string; children: ReactNode; secondary?: boolean; className?: string}) {
  return <Link className={`button${secondary ? " secondary" : ""}${className ? ` ${className}` : ""}`} to={to}>{children} <span data-lg-key="a75b1e5900" aria-hidden="true">↗</span></Link>;
}

export function MonetaLayout({title, children}: {title: string; children: ReactNode}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    document.title = `Fintech Moneta · ${title}`;
    window.scrollTo(0, 0);
  }, [pathname, title]);
  return <div data-lg-key="732c62cc73" className="moneta-site">
    <a data-lg-key="7081f00b24" className="moneta-skip" href="#main-content">Skip to content</a>
    <div data-lg-key="fb6ba42503" className="announcement">A clearer perspective on business money</div>
    <div data-lg-key="46e911914c" className="wrap">
      <header data-lg-key="67d8eeac28" className="site-header">
        <Link className="brand" to="/"><em data-lg-key="6fd13f12bc">◈</em> Moneta</Link>
        <nav data-lg-key="9478c20032" aria-label="Main navigation"><NavLink to="/accounts">Accounts</NavLink><NavLink to="/cards">Cards</NavLink><NavLink to="/company">Company</NavLink></nav>
        <MonetaAction className="header-cta" to="/accounts">Explore</MonetaAction>
      </header>
      <main data-lg-key="77503a41a4" id="main-content">{children}</main>
      <footer data-lg-key="0230843566" className="site-footer">
        <Link className="brand" to="/">Moneta</Link>
        <span data-lg-key="a0e1b5d4f5">Original static design template · All content is illustrative.</span>
        <div data-lg-key="635eea082b" className="footer-links"><Link to="/accounts">Accounts</Link><Link to="/cards">Cards</Link><Link to="/contact">Contact</Link><Link to={user ? "/account" : "/sign-in"}>{user ? "Account" : "Sign in"}</Link></div>
      </footer>
    </div>
  </div>;
}

export function MonetaDashboard() {
  return <div data-lg-key="b3d497f942" className="dashboard">
    <div data-lg-key="594599bdfe" className="dash-top"><b data-lg-key="58aafe82ed">◈ Moneta business</b><span data-lg-key="b2af988ca8" className="pill">Overview</span></div>
    <div data-lg-key="504b33369a" className="dash-label">TOTAL BALANCE · SAMPLE DATA</div>
    <div data-lg-key="6ec9e49816" className="dash-metric">$24,860.00</div>
    <div data-lg-key="a6711c332e" className="mini-label"><span data-lg-key="e663fe6d2d">Your money, clearly organized</span><span data-lg-key="c8506b0800">USD</span></div>
    <div data-lg-key="8c9707bfc7" className="bars" role="img" aria-label="Illustrative monthly cash flow">
      {[32,48,42,68,55,77,69,92,84,100].map((height,index)=><i data-lg-key="f0f6a5c532" key={index} style={{height:`${height}%`}} />)}
    </div>
    <div data-lg-key="be2bc2e349" className="dash-row"><span data-lg-key="44fd8e4185">Studio subscription<br data-lg-key="f5b6a5beb9" /><small data-lg-key="1085dd0ef0">Software · Today</small></span><b data-lg-key="bd22f7ab12">−$29.00</b></div>
    <div data-lg-key="a57a54e7dd" className="dash-row"><span data-lg-key="4268729ac5">Client invoice<br data-lg-key="5334110696" /><small data-lg-key="4f1bd98789">Income · Yesterday</small></span><b data-lg-key="fdd1f63823">+$2,400.00</b></div>
    <div data-lg-key="93c72a34b5" className="fine">Interface concept · no real financial account</div>
  </div>;
}

type MonetaCard = {icon: string; title: string; description: string; to: string; label: string};
export function MonetaCards({title, items}: {title: string; items: MonetaCard[]}) {
  return <section data-lg-key="4ebf0308bd" className="section"><div data-lg-key="651d9ef437" className="section-head"><h2 data-lg-key="26bac50d73">{title}</h2></div><div data-lg-key="0314eb7333" className="grid">
    {items.map(item=><article data-lg-key="69d3d6ea54" key={item.title} className="card"><div data-lg-key="5e1c3530c5" className="card-icon" aria-hidden="true">{item.icon}</div><h3 data-lg-key="4d50978bcc">{item.title}</h3><p data-lg-key="b0b7fab2ff">{item.description}</p><Link className="text-link" to={item.to}>{item.label} →</Link></article>)}
  </div></section>;
}

export function MonetaBanner({title, description, to, label}: {title: string; description: string; to: string; label: string}) {
  return <section data-lg-key="3a96072f65" className="section"><div data-lg-key="d7537a70c2" className="banner"><div data-lg-key="c4eda1bde1"><h2 data-lg-key="e352d09726">{title}</h2><p data-lg-key="ace593445f">{description}</p></div><MonetaAction to={to}>{label}</MonetaAction></div></section>;
}
