import { useAuth } from "../auth/AuthContext";
import { Card, PageHeader } from "../ui";

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div data-lg-key="deacaa8a6e">
      <PageHeader title="Dashboard" subtitle="This page is protected — only visible when signed in." />
      <Card>
        <div data-lg-key="c71afbf5b4" className="font-medium">{user.name || "—"}</div>
        <div data-lg-key="bd04a3f165" className="text-muted-foreground text-sm">{user.email}</div>
      </Card>
    </div>
  );
}
