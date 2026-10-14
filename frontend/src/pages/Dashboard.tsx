import { useAuth } from "../auth/AuthContext";
import { Card, PageHeader } from "../ui";

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="This page is protected — only visible when signed in." />
      <Card>
        <div className="font-medium">{user.name || "—"}</div>
        <div className="text-muted-foreground text-sm">{user.email}</div>
      </Card>
    </div>
  );
}
