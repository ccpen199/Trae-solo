interface ApiResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function api<T = any>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `请求失败 (${res.status})` }
    }
    return { success: true, data: data.data }
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' }
  }
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `?${qs}` : ''
}
