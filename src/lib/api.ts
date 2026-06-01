const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  halls: {
    list: () => request<{ success: boolean; data: any[] }>('/halls'),
    get: (id: number) => request<{ success: boolean; data: any }>(`/halls/${id}`),
    create: (data: any) => request('/halls', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/halls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/halls/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    list: (params?: any) => {
      const query = new URLSearchParams(params).toString()
      return request<{ success: boolean; data: any[] }>(`/bookings${query ? '?' + query : ''}`)
    },
    calendar: (params?: any) => {
      const query = new URLSearchParams(params).toString()
      return request<{ success: boolean; data: any[] }>(`/bookings/calendar${query ? '?' + query : ''}`)
    },
    get: (id: number) => request<{ success: boolean; data: any }>(`/bookings/${id}`),
    checkConflict: (data: any) => request('/bookings/check-conflict', { method: 'POST', body: JSON.stringify(data) }),
    create: (data: any) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) => request(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: number) => request(`/bookings/${id}`, { method: 'DELETE' }),
  },
  sales: {
    list: (bookingId: number) => request<{ success: boolean; data: any[] }>(`/sales/${bookingId}`),
    create: (data: any) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
    lock: (id: number, confirmedBy: string) => request(`/sales/${id}/lock`, { method: 'PUT', body: JSON.stringify({ confirmed_by: confirmedBy }) }),
  },
  contracts: {
    list: () => request<{ success: boolean; data: any[] }>('/contracts'),
    get: (id: number) => request<{ success: boolean; data: any }>(`/contracts/${id}`),
    create: (data: any) => request('/contracts', { method: 'POST', body: JSON.stringify(data) }),
    addPayment: (id: number, data: any) => request(`/contracts/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
    sign: (id: number) => request(`/contracts/${id}/sign`, { method: 'PUT' }),
  },
  execution: {
    list: (params?: any) => {
      const query = new URLSearchParams(params).toString()
      return request<{ success: boolean; data: any[] }>(`/execution${query ? '?' + query : ''}`)
    },
    get: (id: number) => request<{ success: boolean; data: any }>(`/execution/${id}`),
    create: (data: any) => request('/execution', { method: 'POST', body: JSON.stringify(data) }),
    createBatch: (data: any) => request('/execution/batch', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/execution/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/execution/${id}`, { method: 'DELETE' }),
  },
  reports: {
    revenue: (params?: any) => {
      const query = new URLSearchParams(params).toString()
      return request(`/reports/revenue${query ? '?' + query : ''}`)
    },
    hallUsage: (params?: any) => {
      const query = new URLSearchParams(params).toString()
      return request(`/reports/hall-usage${query ? '?' + query : ''}`)
    },
    eventTypes: () => request('/reports/event-types'),
    executionSummary: () => request('/reports/execution-summary'),
    checklist: (bookingId: number) => request(`/reports/checklist?booking_id=${bookingId}`),
    pendingDepositAlert: () => request('/reports/pending-deposit-alert'),
  },
}
