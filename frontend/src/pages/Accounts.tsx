import { MonetaAction, MonetaCards, MonetaDashboard, MonetaLayout } from "../components/Moneta";

export function Accounts() {
  return <MonetaLayout title="Accounts">
    <section data-lg-key="800fc9e912" className="page-intro"><div data-lg-key="eca40a612f" className="eyebrow">Your business, organized</div><h1 data-lg-key="cd0541ef24">A place for<br data-lg-key="7524aa77cd" />every priority.</h1><p data-lg-key="d80e1adecc">A business account concept that separates the everyday from the someday.</p></section>
    <section data-lg-key="a69e7a4ccf" className="split">
      <div data-lg-key="43ea79df65"><h2 data-lg-key="96f2bf7624">See the shape of<br data-lg-key="96212411b2" />your business.</h2><p data-lg-key="3a45d9f771">From incoming work to recurring costs, organize money around the way your team operates.</p><ul data-lg-key="f6d9f9545f" className="list"><li data-lg-key="aa0a8d4fbb">Overview of account balances</li><li data-lg-key="7dd643bb0d">Activity grouped by purpose</li><li data-lg-key="cb6e5da2e6">Separate spaces for planned expenses</li></ul><MonetaAction to="/cards">Explore team cards</MonetaAction></div>
      <MonetaDashboard />
    </section>
    <MonetaCards title="One picture. Different purposes." items={[
      {icon:"◌",title:"Operating",description:"A home for daily business activity and recurring commitments.",to:"/cards",label:"Everyday spending"},
      {icon:"↗",title:"Planned",description:"Set aside a clear view of future costs and planned work.",to:"/company",label:"Our point of view"},
      {icon:"⌁",title:"Team",description:"Keep team purchases visible with an organized card experience.",to:"/cards",label:"Team cards"},
    ]} />
  </MonetaLayout>;
}
