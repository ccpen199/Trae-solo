import api from './index'

export const orderApi = {
  
  create: (data) => {
    return api.post('/api/orders', data)
  },

  getList: (params) => {
    return api.get('/api/orders', { params })
  },

  getStats: () => {
    return api.get('/api/orders/stats')
  },

  getDetail: (id) => {
    return api.get(`/api/orders/${id}`)
  },

  cancel: (id, data) => {
    return api.post(`/api/orders/${id}/cancel`, data)
  },

  confirm: (id) => {
    return api.post(`/api/orders/${id}/confirm`)
  }
}
