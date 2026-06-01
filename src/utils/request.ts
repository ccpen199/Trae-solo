const BASE_URL = '/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>
}

function buildUrlWithParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options
  const url = buildUrlWithParams(`${BASE_URL}${endpoint}`, params)

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T = unknown>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(url, { ...options, method: 'GET' }),
  post: <T = unknown>(url: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T = unknown>(url: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T = unknown>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(url, { ...options, method: 'DELETE' }),
}

export default request
