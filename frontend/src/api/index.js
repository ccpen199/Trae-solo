import request from '@/utils/request'

export const api = {
  health: () => request.get('/health'),

  earthquakes: {
    latest: () => request.get('/earthquakes/latest'),
    list: (params) => request.get('/earthquakes', { params }),
    create: (data) => request.post('/earthquakes', data),
    get: (id) => request.get(`/earthquakes/${id}`),
    remove: (id) => request.delete(`/earthquakes/${id}`),
    addAftershock: (data) => request.post('/earthquakes/aftershocks', data),
    addKeyArea: (data) => request.post('/earthquakes/key-areas', data)
  },

  disasters: {
    list: (params) => request.get('/disasters', { params }),
    get: (id) => request.get(`/disasters/${id}`),
    create: (data) => {
      const formData = new FormData()
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key])
        }
      })
      return request.post('/disasters', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    update: (id, data) => request.put(`/disasters/${id}`, data),
    remove: (id) => request.delete(`/disasters/${id}`),
    uploadPhoto: (id, file) => {
      const formData = new FormData()
      formData.append('photo', file)
      return request.post(`/disasters/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
  },

  rescue: {
    teams: (params) => request.get('/rescue/teams', { params }),
    createTeam: (data) => request.post('/rescue/teams', data),
    updateTeam: (id, data) => request.put(`/rescue/teams/${id}`, data),
    vehicles: () => request.get('/rescue/vehicles'),
    createVehicle: (data) => request.post('/rescue/vehicles', data),
    missions: (params) => request.get('/rescue/missions', { params }),
    getMission: (id) => request.get(`/rescue/missions/${id}`),
    createMission: (data) => request.post('/rescue/missions', data),
    updateMission: (id, data) => request.put(`/rescue/missions/${id}`, data),
    removeMission: (id) => request.delete(`/rescue/missions/${id}`)
  },

  materials: {
    items: (params) => request.get('/materials/items', { params }),
    createItem: (data) => request.post('/materials/items', data),
    updateItem: (id, data) => request.put(`/materials/items/${id}`, data),
    demands: (params) => request.get('/materials/demands', { params }),
    createDemand: (data) => request.post('/materials/demands', data),
    updateDemand: (id, data) => request.put(`/materials/demands/${id}`, data),
    allocations: (params) => request.get('/materials/allocations', { params }),
    createAllocation: (data) => request.post('/materials/allocations', data),
    updateAllocation: (id, data) => request.put(`/materials/allocations/${id}`, data),
    gaps: () => request.get('/materials/gaps')
  },

  reports: {
    summary: () => request.get('/reports/summary'),
    resources: () => request.get('/reports/resources/overview'),
    briefing: (format) => request.get('/reports/export/briefing', { params: { format } }),
    logs: (params) => request.get('/reports/logs', { params })
  }
}

export default api
