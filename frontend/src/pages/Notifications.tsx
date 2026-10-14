import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Bell } from "lucide-react";
import { Badge, Button, ListPage } from "../ui";

// Pre-embedded in-app notifications. Every endpoint is scoped to the signed-in
// user server-side, so this page can only ever show your own rows. Apps raise
// notifications from their own events (s.notify in notifications.go); the
// "Send a test one" button below is just a demo — delete it once yours does.
export type Notification = {
  id: number;
  title: string;
  body: string;
  type: string;
  url: string;
  read_at: string | null;
  inserted_at: string;
};

// Notification types the Badge kit can render directly. "danger" is shadcn's
// "destructive" — mapped in variantFor rather than renamed in the API, since
// the type strings come from the backend.
const badgeVariants = ["success", "warning", "info"] as const;
type BadgeVariant = (typeof badgeVariants)[number];

export function Notifications() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ notifications: Notification[]; unread: number }>("/api/notifications");
    setItems(data.notifications);
  }, []);

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  }

  const unread = (items ?? []).filter((n) => !n.read_at).length;

  return (
    <ListPage
      title="Notifications"
      description={unread > 0 ? `${unread} unread` : "You're all caught up."}
      loading={items === null}
      empty={items !== null && items.length === 0}
      emptyProps={{
        icon: <Bell />,
        title: "No notifications yet",
        description: "You're all caught up.",
      }}
      actions={
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  api("/api/notifications", {
                    method: "POST",
                    body: JSON.stringify({
                      title: "Hello from your app",
                      body: "This notification was created by the demo button.",
                      type: "info",
                    }),
                  }),
                )
              }
            >
              Send a test one
            </Button>
            <Button
              size="sm"
              disabled={busy || unread === 0}
              onClick={() => void run(() => api("/api/notifications/read-all", { method: "POST" }))}
            >
              Mark all read
            </Button>
          </>
        }
    >
      <ul className="divide-y rounded-xl border">
          {(items ?? []).map((n) => (
            <li key={n.id} className={`list-item ${n.read_at ? "" : "list-item-unread"}`.trim()}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong>{n.title}</strong>
                  <Badge variant={variantFor(n.type)}>{n.type}</Badge>
                </div>
                {n.body && <p className="text-muted-foreground mt-1 text-sm">{n.body}</p>}
                <p className="text-muted-foreground mt-1 text-xs">{new Date(n.inserted_at).toLocaleString()}</p>
              </div>
              {!n.read_at && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void run(() => api(`/api/notifications/${n.id}/read`, { method: "POST" }))
                  }
                >
                  Mark read
                </Button>
              )}
            </li>
          ))}
      </ul>
    </ListPage>
  );
}

// `type` is a free-form tag on the server; anything unrecognised falls back to
// the neutral badge.
function variantFor(type: string): BadgeVariant | "destructive" | "default" {
  if (type === "danger" || type === "error") return "destructive";
  return badgeVariants.includes(type as BadgeVariant) ? (type as BadgeVariant) : "default";
}
