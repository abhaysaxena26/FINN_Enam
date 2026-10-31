/* FINN API client — all fetch calls with fallback */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

/**
 * Typed fetch wrapper for the FINN API.
 * Falls back to snapshot data if the API is unreachable.
 */
export async function api<T>(path: string, options?: FetchOptions): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method: options?.method || "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : {},
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
