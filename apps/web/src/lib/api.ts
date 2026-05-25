// Base URL for API requests — injected at build time via VITE_API_URL.
// Falls back to empty string in dev (Vite proxy handles /api and /auth).
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}