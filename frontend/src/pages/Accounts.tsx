import { MonetaAction, MonetaCards, MonetaDashboard, MonetaLayout } from "../components/Moneta";

export function Accounts() {
  return <MonetaLayout title="Accounts">
    <section className="page-intro"><div className="eyebrow">Your business, organized</div><h1>A place for<br />every priority.</h1><p>A business account concept that separates the everyday from the someday.</p></section>
    <section className="split">
      <div><h2>See the shape of<br />your business.</h2><p>From incoming work to recurring costs, organize money around the way your team operates.</p><ul className="list"><li>Overview of account balances</li><li>Activity grouped by purpose</li><li>Separate spaces for planned expenses</li></ul><MonetaAction to="/cards">Explore team cards</MonetaAction></div>
      <MonetaDashboard />
    </section>
    <MonetaCards title="One picture. Different purposes." items={[
      {icon:"◌",title:"Operating",description:"A home for daily business activity and recurring commitments.",to:"/cards",label:"Everyday spending"},
      {icon:"↗",title:"Planned",description:"Set aside a clear view of future costs and planned work.",to:"/company",label:"Our point of view"},
      {icon:"⌁",title:"Team",description:"Keep team purchases visible with an organized card experience.",to:"/cards",label:"Team cards"},
    ]} />
  </MonetaLayout>;
}
