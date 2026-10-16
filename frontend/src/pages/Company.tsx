import { MonetaBanner, MonetaCards, MonetaLayout } from "../components/Moneta";

export function Company() {
  return <MonetaLayout title="Company">
    <section className="page-intro"><div className="eyebrow">Our point of view</div><h1>Business is complex.<br />Your view need not be.</h1><p>Moneta is a fictional finance brand exploring a clearer way to see and organize business money.</p></section>
    <MonetaCards title="A few things we believe." items={[
      {icon:"◌",title:"Clarity comes first",description:"Useful information should be easy to find and simple to understand.",to:"/accounts",label:"A clearer overview"},
      {icon:"⌁",title:"Context matters",description:"Every number belongs to a bigger picture: your work, your people and your plans.",to:"/accounts",label:"Organize with purpose"},
      {icon:"↗",title:"Keep moving forward",description:"Good tools make space for considered decisions and a clear next step.",to:"/cards",label:"Thoughtful spending"},
    ]} />
    <MonetaBanner title="See the idea in action." description="Explore the illustrative account and card experiences." to="/accounts" label="Explore accounts" />
  </MonetaLayout>;
}
