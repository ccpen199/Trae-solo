import client from './client'

export const authAPI = {
  login: (data: { username: string; password: string }) => client.post('/auth/login', data),
  register: (data: Record<string, any>) => client.post('/auth/register', data),
  getMe: () => client.get('/auth/me'),
  getLoginInfo: () => client.get('/auth/login/info'),
}

export const deviceAPI = {
  list: (params?: Record<string, any>) => client.get('/devices', { params }),
  create: (data: Record<string, any>) => client.post('/devices', data),
  update: (id: string, data: Record<string, any>) => client.put(`/devices/${id}`, data),
  delete: (id: string) => client.delete(`/devices/${id}`),
  command: (id: string, data: Record<string, any>) => client.post(`/devices/${id}/command`, data),
  discover: () => client.get('/devices/discover'),
}

export const sceneAPI = {
  list: () => client.get('/scenes'),
  create: (data: Record<string, any>) => client.post('/scenes', data),
  update: (id: string, data: Record<string, any>) => client.put(`/scenes/${id}`, data),
  delete: (id: string) => client.delete(`/scenes/${id}`),
  execute: (id: string) => client.post(`/scenes/${id}/execute`),
}

export const serviceAPI = {
  list: (params?: Record<string, any>) => client.get('/services', { params }),
  create: (data: Record<string, any>) => client.post('/services', data),
  update: (id: string, data: Record<string, any>) => client.put(`/services/${id}`, data),
  diagnose: (id: string) => client.post(`/services/${id}/diagnose`),
  extendWarranty: (id: string, data: Record<string, any>) => client.post(`/services/${id}/extend-warranty`, data),
}

export const productAPI = {
  list: (params?: Record<string, any>) => client.get('/products', { params }),
  create: (data: Record<string, any>) => client.post('/products', data),
  update: (id: string, data: Record<string, any>) => client.put(`/products/${id}`, data),
  getStock: (id: string) => client.get(`/products/${id}/stock`),
}

export const tradeinAPI = {
  estimate: (data: Record<string, any>) => client.post('/tradein/estimate', data),
  listEstimations: () => client.get('/tradein/estimations'),
}

export const energyAPI = {
  list: (params?: Record<string, any>) => client.get('/energy', { params }),
  record: (data: Record<string, any>) => client.post('/energy', data),
  report: (params?: Record<string, any>) => client.get('/energy/report', { params }),
  greenReport: () => client.get('/energy/green-report'),
}

export const pointsAPI = {
  balance: () => client.get('/points/balance'),
  transactions: (params?: Record<string, any>) => client.get('/points/transactions', { params }),
  earn: (data: Record<string, any>) => client.post('/points/earn', data),
  spend: (data: Record<string, any>) => client.post('/points/spend', data),
}

export const firmwareAPI = {
  listReleases: () => client.get('/firmware/releases'),
  createRelease: (data: Record<string, any>) => client.post('/firmware/releases', data),
  updateRelease: (id: string, data: Record<string, any>) => client.put(`/firmware/releases/${id}`, data),
  push: (id: string, data: Record<string, any>) => client.post(`/firmware/releases/${id}/push`, data),
  listUpdates: (params?: Record<string, any>) => client.get('/firmware/updates', { params }),
}

export const channelAPI = {
  list: () => client.get('/channels'),
  create: (data: Record<string, any>) => client.post('/channels', data),
  update: (id: string, data: Record<string, any>) => client.put(`/channels/${id}`, data),
  bindDevice: (id: string, data: Record<string, any>) => client.post(`/channels/${id}/bind-device`, data),
  unbindDevice: (channelId: string, deviceId: string) => client.delete(`/channels/${channelId}/bind-device/${deviceId}`),
  getDevices: (id: string) => client.get(`/channels/${id}/devices`),
}

export const irBridgeAPI = {
  list: () => client.get('/ir-bridges'),
  create: (data: Record<string, any>) => client.post('/ir-bridges', data),
  learn: (id: string, data: Record<string, any>) => client.post(`/ir-bridges/${id}/learn`, data),
  send: (id: string, data: Record<string, any>) => client.post(`/ir-bridges/${id}/send`, data),
  getCodes: (id: string) => client.get(`/ir-bridges/${id}/codes`),
}

export const healthAPI = {
  getPrediction: (deviceId: string) => client.get(`/health/prediction/${deviceId}`),
  runPrediction: (deviceId: string) => client.post(`/health/prediction/${deviceId}`),
  listPredictions: () => client.get('/health/predictions'),
}

export const dashboardAPI = {
  getSummary: () => client.get('/dashboard/summary'),
}

export const homeAPI = {
  getOverview: () => client.get('/home/overview'),
}
