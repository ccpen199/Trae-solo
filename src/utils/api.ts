const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`)
  }

  if (data.success === false) {
    throw new Error(data.error || '请求失败')
  }

  return data.data || data.list || data as T
}

export const api = {
  get<T>(url: string) {
    return request<T>(url, { method: 'GET' })
  },
  post<T>(url: string, data?: unknown) {
    return request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined })
  },
  put<T>(url: string, data?: unknown) {
    return request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined })
  },
  del<T>(url: string) {
    return request<T>(url, { method: 'DELETE' })
  },
}

export async function requestRaw<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '请求失败' }))
    throw new Error(error.error || error.message || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
