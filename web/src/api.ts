// Single source of truth for the backend base URL.
// Vite replaces import.meta.env.VITE_API_URL at build time: it comes from
// web/.env in local dev. In a production build it is left unset, so the
// browser calls the same-origin /api proxy that nginx forwards to the
// API container — no public API URL or CORS origin is needed then.
// Fall back to the local API port only when explicitly configured.
const configured = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE_URL =
  configured && configured.trim() !== "" ? configured : "/api";

export const ACCESS_TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const USER_KEY = "user";

/** Fired when the session cannot be recovered (refresh failed). */
export const AUTH_LOGOUT_EVENT = "auth:logout";

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Authenticated fetch. Attaches the access token; on a 401 it tries
 * POST /refresh once and retries. If the refresh fails, the stored
 * session is cleared and an auth:logout event is fired so AuthContext
 * can log the user out. Callers do not need to handle tokens.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  retried = false
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401 && token && !retried) {
    if (await tryRefresh()) {
      return apiFetch(path, init, true);
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
  return res;
}
