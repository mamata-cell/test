import { MonetaAction, MonetaBanner, MonetaCards, MonetaDashboard, MonetaLayout } from "../components/Moneta";

export function Home() {
  return (
    <MonetaLayout title="Home">
      <section data-lg-key="b65575203d" className="hero">
        <div data-lg-key="9f35690d8e">
          <div data-lg-key="a203981090" className="eyebrow">Business money, in perspective</div>
          <h1 data-lg-key="1d0779b55e">A clear view.<br data-lg-key="95aa239b25" />A confident next step.</h1>
          <p data-lg-key="56014de30b">One considered home for your business finances. See the everyday details and keep the bigger picture in sight.</p>
          <div data-lg-key="5dbcd89eb9" className="actions">
            <MonetaAction to="/accounts">Explore accounts</MonetaAction>
            <MonetaAction to="/company" secondary>Meet Moneta</MonetaAction>
          </div>
          <div data-lg-key="2df6f28693" className="fine">Fictional financial product · all figures are illustrative.</div>
        </div>
        <MonetaDashboard />
      </section>
      <div data-lg-key="9d5e1a85be" className="trust"><small data-lg-key="9380a134af">MADE FOR THE EVERYDAY</small><span data-lg-key="b402c20694">Your business</span><span data-lg-key="d7174ab495">Your priorities</span><span data-lg-key="3c31acb66c">Your bigger picture</span></div>
      <MonetaCards title="Clarity, from every angle." items={[
        {icon:"◈",title:"Accounts with purpose",description:"Give everyday spending, future plans and team expenses a clear place.",to:"/accounts",label:"Explore accounts"},
        {icon:"▰",title:"Spend with intention",description:"A considered card experience with team visibility at its heart.",to:"/cards",label:"See card design"},
        {icon:"↗",title:"A view that connects",description:"Bring balance, activity and the next step into one coherent picture.",to:"/company",label:"Our approach"},
      ]} />
      <MonetaBanner title="Make space for what is next." description="Explore a business finance experience built around a clearer view." to="/accounts" label="Discover Moneta" />
    </MonetaLayout>
  );
}
