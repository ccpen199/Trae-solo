const API_BASE = '/api'

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  try {
    const stored = localStorage.getItem('auth-user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user?.id) {
        headers['x-user-id'] = String(user.id)
      }
    }
  } catch {}
  return headers
}

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `API Error: ${res.status}`)
  }
  return res.json()
}

export { API_BASE }
