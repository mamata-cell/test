import { MonetaAction, MonetaBanner, MonetaCards, MonetaDashboard, MonetaLayout } from "../components/Moneta";

export function Home() {
  return (
    <MonetaLayout title="Home">
      <section className="hero">
        <div>
          <div className="eyebrow">Business money, in perspective</div>
          <h1>A clear view.<br />A confident next step.</h1>
          <p>One considered home for your business finances. See the everyday details and keep the bigger picture in sight.</p>
          <div className="actions">
            <MonetaAction to="/accounts">Explore accounts</MonetaAction>
            <MonetaAction to="/company" secondary>Meet Moneta</MonetaAction>
          </div>
          <div className="fine">Fictional financial product · all figures are illustrative.</div>
        </div>
        <MonetaDashboard />
      </section>
      <div className="trust"><small>MADE FOR THE EVERYDAY</small><span>Your business</span><span>Your priorities</span><span>Your bigger picture</span></div>
      <MonetaCards title="Clarity, from every angle." items={[
        {icon:"◈",title:"Accounts with purpose",description:"Give everyday spending, future plans and team expenses a clear place.",to:"/accounts",label:"Explore accounts"},
        {icon:"▰",title:"Spend with intention",description:"A considered card experience with team visibility at its heart.",to:"/cards",label:"See card design"},
        {icon:"↗",title:"A view that connects",description:"Bring balance, activity and the next step into one coherent picture.",to:"/company",label:"Our approach"},
      ]} />
      <MonetaBanner title="Make space for what is next." description="Explore a business finance experience built around a clearer view." to="/accounts" label="Discover Moneta" />
    </MonetaLayout>
  );
}
