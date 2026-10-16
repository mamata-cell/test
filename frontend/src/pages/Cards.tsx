import { MonetaAction, MonetaBanner, MonetaLayout } from "../components/Moneta";

export function Cards() {
  return <MonetaLayout title="Cards">
    <section className="page-intro"><div className="eyebrow">A thoughtful card experience</div><h1>Built for the way<br />your team works.</h1><p>A considered design for team spending, everyday purchases and a clearer view of activity.</p></section>
    <section className="split">
      <div className="art-square"><img src="/moneta/team-cards.svg" alt="Original illustration of two concept business cards" width={640} height={600} /></div>
      <div><span className="pill">MONETA / TEAM</span><h2 style={{marginTop:22}}>The details.<br />In your hands.</h2><p>Give each card a purpose and keep the whole team on the same page.</p><ul className="list"><li>Physical and virtual card concepts</li><li>Clear activity and spending categories</li><li>A unified team overview</li></ul><MonetaAction to="/accounts">View the account experience</MonetaAction></div>
    </section>
    <MonetaBanner title="Designed for clarity." description="This is a static product concept. No card issuance, banking, deposits or payments are provided." to="/company" label="About Moneta" />
  </MonetaLayout>;
}
