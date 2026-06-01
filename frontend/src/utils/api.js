const API_BASE = '/api'

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const api = {
  getHealth: () => request('/health'),
  
  getProducts: () => request('/products'),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  
  getStations: () => request('/stations'),
  createStation: (data) => request('/stations', { method: 'POST', body: JSON.stringify(data) }),
  
  getCameras: () => request('/cameras'),
  createCamera: (data) => request('/cameras', { method: 'POST', body: JSON.stringify(data) }),
  
  getModelVersions: () => request('/model-versions'),
  createModelVersion: (data) => request('/model-versions', { method: 'POST', body: JSON.stringify(data) }),
  publishModel: (id) => request(`/model-versions/${id}/publish`, { method: 'PUT' }),
  
  getInspectionTasks: () => request('/inspection-tasks'),
  getInspectionTask: (id) => request(`/inspection-tasks/${id}`),
  createInspectionTask: (data) => request('/inspection-tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id, status) => request(`/inspection-tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteInspectionTask: (id) => request(`/inspection-tasks/${id}`, { method: 'DELETE' }),
  
  getInspectionItems: (taskId) => request(`/inspection-items/${taskId}`),
  createInspectionItem: (data) => request('/inspection-items', { method: 'POST', body: JSON.stringify(data) }),
  updateInspectionItem: (id, data) => request(`/inspection-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInspectionItem: (id) => request(`/inspection-items/${id}`, { method: 'DELETE' }),
  
  getDefectRecords: (params) => {
    const query = new URLSearchParams(params).toString()
    return request(`/defect-records${query ? '?' + query : ''}`)
  },
  getDefectRecord: (id) => request(`/defect-records/${id}`),
  createDefectRecord: (data) => request('/defect-records', { method: 'POST', body: JSON.stringify(data) }),
  rejudgeDefect: (id, data) => request(`/defect-records/${id}/rejudge`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getDeviceEvents: (params) => {
    const query = new URLSearchParams(params).toString()
    return request(`/device-events${query ? '?' + query : ''}`)
  },
  createDeviceEvent: (data) => request('/device-events', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeEvent: (id, by) => request(`/device-events/${id}/acknowledge`, { method: 'PUT', body: JSON.stringify({ acknowledged_by: by }) }),
  
  getMaintenanceTasks: (params) => {
    const query = new URLSearchParams(params).toString()
    return request(`/maintenance-tasks${query ? '?' + query : ''}`)
  },
  updateMaintenanceTask: (id, data) => request(`/maintenance-tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getStatisticsOverview: (params) => {
    const query = new URLSearchParams(params).toString()
    return request(`/statistics/overview${query ? '?' + query : ''}`)
  },
  getQualityTrend: (days) => request(`/statistics/quality-trend?days=${days}`),
}
