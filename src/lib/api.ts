import { useAuthStore } from '@/store'

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { user, token } = useAuthStore.getState()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }
  if (user) {
    headers['x-user-id'] = user.id
    headers['x-user-role'] = user.role
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`/api${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || `请求失败 (${res.status})`)
  }
  return res.json()
}
