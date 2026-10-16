import { MonetaAction, MonetaBanner, MonetaLayout } from "../components/Moneta";

export function Cards() {
  return <MonetaLayout title="Cards">
    <section data-lg-key="8fc9e7b701" className="page-intro"><div data-lg-key="13d5755eb5" className="eyebrow">A thoughtful card experience</div><h1 data-lg-key="e9ea248c08">Built for the way<br data-lg-key="54463b190f" />your team works.</h1><p data-lg-key="6f3d859c9b">A considered design for team spending, everyday purchases and a clearer view of activity.</p></section>
    <section data-lg-key="f6a7cce879" className="split">
      <div data-lg-key="ccff43029a" className="art-square"><img data-lg-key="e059abb5b2" src="/moneta/team-cards.svg" alt="Original illustration of two concept business cards" width={640} height={600} /></div>
      <div data-lg-key="3e7bf04410"><span data-lg-key="74ff1415a9" className="pill">MONETA / TEAM</span><h2 data-lg-key="8092fb154d" style={{marginTop:22}}>The details.<br data-lg-key="ac2b5193f8" />In your hands.</h2><p data-lg-key="a1fc754185">Give each card a purpose and keep the whole team on the same page.</p><ul data-lg-key="2e08d982f4" className="list"><li data-lg-key="ab816297a2">Physical and virtual card concepts</li><li data-lg-key="8f095990c4">Clear activity and spending categories</li><li data-lg-key="f74b976c57">A unified team overview</li></ul><MonetaAction to="/accounts">View the account experience</MonetaAction></div>
    </section>
    <MonetaBanner title="Designed for clarity." description="This is a static product concept. No card issuance, banking, deposits or payments are provided." to="/company" label="About Moneta" />
  </MonetaLayout>;
}
