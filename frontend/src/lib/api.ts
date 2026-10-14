export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`HTTP ${status}`);
    this.name = "ApiError";
  }
}

// fetch wrapper: same-origin (via Vite's /api proxy), sends cookies, parses JSON,
// and throws ApiError on non-2xx so callers can branch on `.status` (e.g. 401).
export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  // A FormData body (file uploads) must set its own multipart Content-Type,
  // boundary included — forcing application/json here would corrupt it.
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, {
    credentials: "include",
    ...opts,
    // After ...opts, so a caller's headers MERGE with the default instead of
    // replacing the whole object — spreading opts last would drop the
    // Content-Type decision above whenever a caller passes any header of its own.
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return undefined as T;
}
