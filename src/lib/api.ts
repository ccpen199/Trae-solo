interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  total?: number
  code?: string
  message?: string
  token?: string
  user?: any
  role?: string
}

const BASE_URL = '/api'

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.token || null
    }
  } catch {
    // ignore
  }
  return localStorage.getItem('token')
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = params ? `${BASE_URL}${url}${buildQueryString(params)}` : `${BASE_URL}${url}`

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        ...data,
        error: data.error || `请求失败: ${response.status}`,
      } as ApiResponse<T>
    }

    return data as ApiResponse<T>
  } catch (err: any) {
    return {
      success: false,
      error: err.message || '网络错误',
    }
  }
}

async function upload<T>(
  url: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {}

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        ...data,
        error: data.error || `请求失败: ${response.status}`,
      } as ApiResponse<T>
    }

    return data as ApiResponse<T>
  } catch (err: any) {
    return {
      success: false,
      error: err.message || '网络错误',
    }
  }
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    request<T>(url, { method: 'GET' }, params),

  post: <T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, params),

  put: <T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, params),

  delete: <T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    request<T>(url, { method: 'DELETE' }, params),

  patch: <T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<ApiResponse<T>> =>
    request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }, params),

  upload: <T>(url: string, formData: FormData): Promise<ApiResponse<T>> =>
    upload<T>(url, formData),
}

export default api
