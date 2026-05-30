// Centralised API base URL + auth-token helpers for the frontend.
// We use Bearer tokens stored in localStorage so the app works across
// Emergent's reverse proxy without cookie / CORS friction.

const RAW_BASE =
  (import.meta as any).env?.REACT_APP_BACKEND_URL ??
  (import.meta as any).env?.VITE_BACKEND_URL ??
  "";

export const API_BASE_URL: string = String(RAW_BASE).replace(/\/+$/, "");

export const AUTH_TOKEN_KEY = "muslim_world_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  else window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * fetch wrapper that:
 *  - prefixes relative /api/... URLs with REACT_APP_BACKEND_URL
 *  - injects Authorization: Bearer <token> from localStorage
 *  - throws on non-ok responses with a parsed error body
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers ?? {});
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    init.body &&
    !headers.has("Content-Type") &&
    typeof init.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}

export async function apiJson<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const msg =
      detail?.detail ??
      detail?.error ??
      (typeof detail === "string" ? detail : `HTTP ${res.status}`);
    throw new Error(typeof msg === "string" ? msg : `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}
