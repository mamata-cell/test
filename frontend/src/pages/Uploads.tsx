import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, api } from "../lib/api";
import { Button, Card, EmptyState, PageHeader, Spinner } from "../ui";

// Pre-embedded file uploads. Posts a multipart form to /api/uploads; the Go API
// stores the bytes on local disk under a generated name and serves them back
// from this same origin at /api/uploads/{stored_name}. Protected — the guard is
// on the route in App.tsx and again on every endpoint.
export type Upload = {
  id: number;
  stored_name: string;
  original_name: string;
  content_type: string;
  byte_size: number;
  inserted_at: string;
  url: string;
};

export function Uploads() {
  const [uploads, setUploads] = useState<Upload[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const data = await api<{ uploads: Upload[] }>("/api/uploads");
    setUploads(data.uploads);
  }, []);

  useEffect(() => {
    void load().catch(() => setError("Could not load your files."));
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api<{ upload: Upload }>("/api/uploads", { method: "POST", body: form });
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Files" subtitle="Uploads are stored on the app's own disk and served back from /api/uploads." />

      <Card>
        <form className="flex flex-wrap items-center gap-3" onSubmit={onSubmit}>
          <input ref={fileRef} type="file" className="text-muted-foreground file:text-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm text-sm" name="file" />
          <Button type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </form>
        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
        <p className="text-muted-foreground mt-2 text-sm">Up to 10 MB — png, jpg, gif, webp, pdf, txt or csv.</p>
      </Card>

      <div className="mt-10">
        {uploads === null ? (
          <Spinner />
        ) : uploads.length === 0 ? (
          <EmptyState icon="📁" title="No files yet" description="Upload one above to see it here." />
        ) : (
          <ul className="divide-y rounded-xl border">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-center gap-4 p-4">
                {u.content_type.startsWith("image/") && (
                  <img className="size-12 shrink-0 rounded-md border object-cover" src={u.url} alt={u.original_name} />
                )}
                <div className="min-w-0 flex-1">
                  <a href={u.url} target="_blank" rel="noreferrer">
                    {u.original_name}
                  </a>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatBytes(u.byte_size)} · {new Date(u.inserted_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 413) return "That file is too large (10 MB max).";
    if (err.status === 415) return "That file type isn't allowed.";
    if (err.status === 400) return "Choose a file first.";
  }
  return "Upload failed. Try again.";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
