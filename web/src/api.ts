// Single source of truth for the backend base URL.
// Vite replaces import.meta.env.VITE_API_URL at build time: it comes from
// web/.env in local dev, or from the VITE_API_URL build arg in Docker.
// Fall back to the local API port so `npm run dev` works with no .env.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";
