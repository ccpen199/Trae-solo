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

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    })
  } catch (networkErr: any) {
    throw new Error('网络连接失败，请检查网络后重试')
  }

  let data: any
  try {
    data = await res.json()
  } catch {
    if (!res.ok) {
      throw new Error(`服务器错误 (HTTP ${res.status})`)
    }
    throw new Error('服务器返回数据格式异常')
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `请求失败 (HTTP ${res.status})`)
  }

  if (data.success === false) {
    throw new Error(data.error || data.message || '操作失败')
  }

  return data as T
}
