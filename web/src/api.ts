// Single source of truth for the backend base URL.
// Vite replaces import.meta.env.VITE_API_URL at build time: it comes from
// web/.env in local dev. In a production build it is left unset, so the
// browser calls the same-origin /api proxy that nginx forwards to the
// API container — no public API URL or CORS origin is needed then.
// Fall back to the local API port only when explicitly configured.
const configured = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE_URL =
  configured && configured.trim() !== "" ? configured : "/api";
