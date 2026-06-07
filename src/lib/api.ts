interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`/api${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  })
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }
  return data.data as T
}

export const api = {
  getOverview: (): Promise<any> =>
    request('/analytics/overview', { method: 'GET' }),

  getRiders: (params?: { page?: number; pageSize?: number; status?: string; is_novice?: number; search?: string }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/riders${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  getRider: (id: number): Promise<any> =>
    request(`/riders/${id}`, { method: 'GET' }),

  createRider: (data: any): Promise<any> =>
    request('/riders', { method: 'POST', body: data }),

  updateRider: (id: number, data: any): Promise<any> =>
    request(`/riders/${id}`, { method: 'PUT', body: data }),

  deleteRider: (id: number): Promise<any> =>
    request(`/riders/${id}`, { method: 'DELETE' }),

  getRiderViolations: (id: number): Promise<any> =>
    request(`/riders/${id}/violations`, { method: 'GET' }),

  addRiderViolation: (id: number, data: any): Promise<any> =>
    request(`/riders/${id}/violations`, { method: 'POST', body: data }),

  getRiderIncome: (id: number): Promise<any> =>
    request(`/riders/${id}/income`, { method: 'GET' }),

  assignMentor: (riderId: number, mentorId: number): Promise<any> =>
    request(`/riders/${riderId}/mentor`, { method: 'POST', body: { mentor_id: mentorId } }),

  grantNoviceCard: (riderId: number, data: any): Promise<any> =>
    request(`/riders/${riderId}/novice-card`, { method: 'POST', body: data }),

  useNoviceCard: (riderId: number, cardId: number): Promise<any> =>
    request(`/riders/${riderId}/novice-card/${cardId}/use`, { method: 'PUT' }),

  getOrders: (params?: { page?: number; pageSize?: number; status?: string; rider_id?: number; search?: string }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/orders${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  getOrder: (id: number): Promise<any> =>
    request(`/orders/${id}`, { method: 'GET' }),

  createOrder: (data: any): Promise<any> =>
    request('/orders', { method: 'POST', body: data }),

  updateOrder: (id: number, data: any): Promise<any> =>
    request(`/orders/${id}`, { method: 'PUT', body: data }),

  pickupOrder: (id: number): Promise<any> =>
    request(`/orders/${id}/pickup`, { method: 'PUT' }),

  deliverOrder: (id: number): Promise<any> =>
    request(`/orders/${id}/deliver`, { method: 'PUT' }),

  cancelOrder: (id: number): Promise<any> =>
    request(`/orders/${id}/cancel`, { method: 'PUT' }),

  getOrderTracks: (id: number): Promise<any> =>
    request(`/orders/${id}/tracks`, { method: 'GET' }),

  addOrderTrack: (id: number, data: any): Promise<any> =>
    request(`/orders/${id}/track`, { method: 'POST', body: data }),

  getGrids: (): Promise<any> =>
    request('/grids', { method: 'GET' }),

  getHeatmapData: (): Promise<any> =>
    request('/grids/heatmap/data', { method: 'GET' }),

  getGrid: (id: number): Promise<any> =>
    request(`/grids/${id}`, { method: 'GET' }),

  updateGrid: (id: number, data: any): Promise<any> =>
    request(`/grids/${id}`, { method: 'PUT', body: data }),

  autoDispatch: (orderId: number): Promise<any> =>
    request('/dispatch/auto', { method: 'POST', body: { order_id: orderId } }),

  manualDispatch: (orderId: number, riderId: number): Promise<any> =>
    request('/dispatch/manual', { method: 'POST', body: { order_id: orderId, rider_id: riderId } }),

  getDispatchLogs: (params?: { page?: number; pageSize?: number }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/dispatch/logs${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  getScenarios: (params?: { category?: string }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/training/scenarios${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  getScenario: (id: number): Promise<any> =>
    request(`/training/scenarios/${id}`, { method: 'GET' }),

  createScenario: (data: any): Promise<any> =>
    request('/training/scenarios', { method: 'POST', body: data }),

  getTrainingRecords: (params?: { rider_id?: number }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/training/records${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  createTrainingRecord: (data: any): Promise<any> =>
    request('/training/records', { method: 'POST', body: data }),

  getAlerts: (params?: { resolved?: number }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/monitoring/alerts${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  createAlert: (data: any): Promise<any> =>
    request('/monitoring/alerts', { method: 'POST', body: data }),

  resolveAlert: (id: number): Promise<any> =>
    request(`/monitoring/alerts/${id}/resolve`, { method: 'PUT' }),

  getTracks: (params?: { rider_id?: number; order_id?: number }): Promise<any> => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return request(`/monitoring/tracks${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  checkDeviation: (data: { order_id: number; current_lat: number; current_lng: number }): Promise<any> =>
    request('/monitoring/tracks/check-deviation', { method: 'POST', body: data }),

  getRiderIncomeRanking: (limit?: number): Promise<any> => {
    const query = limit !== undefined ? `?limit=${limit}` : ''
    return request(`/analytics/riders/income${query}`, { method: 'GET' })
  },

  getViolationClusters: (): Promise<any> =>
    request('/analytics/violations/cluster', { method: 'GET' }),

  getCapacityGaps: (): Promise<any> =>
    request('/analytics/capacity/gaps', { method: 'GET' }),

  getOrderTrend: (days?: number): Promise<any> => {
    const query = days !== undefined ? `?days=${days}` : ''
    return request(`/analytics/orders/trend${query}`, { method: 'GET' })
  },

  getIncomeBreakdown: (): Promise<any> =>
    request('/analytics/income/breakdown', { method: 'GET' }),
}
