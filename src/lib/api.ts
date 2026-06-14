const BASE = '/api'

export async function api<T = any>(path: string, options?: RequestInit): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  return res.json()
}

export function apiPost<T = any>(path: string, body: any) {
  return api<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPut<T = any>(path: string, body: any) {
  return api<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}

export function apiDelete<T = any>(path: string) {
  return api<T>(path, { method: 'DELETE' })
}
