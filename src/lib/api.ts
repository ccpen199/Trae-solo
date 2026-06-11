const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.API_BASE_URL || "http://127.0.0.1:59146").replace(/\/$/, "")

export const apiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

export const apiFetch = (path: string, init?: RequestInit) => fetch(apiUrl(path), init)
