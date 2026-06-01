import { useAuthStore } from '@/store/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function authFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.message || res.statusText)
  }
  return res.json()
}

export const api = {
  get<T = unknown>(url: string) {
    return authFetch<T>(url)
  },
  post<T = unknown>(url: string, data?: unknown) {
    return authFetch<T>(url, { method: 'POST', body: JSON.stringify(data) })
  },
  put<T = unknown>(url: string, data?: unknown) {
    return authFetch<T>(url, { method: 'PUT', body: JSON.stringify(data) })
  },
  del<T = unknown>(url: string) {
    return authFetch<T>(url, { method: 'DELETE' })
  },
}
