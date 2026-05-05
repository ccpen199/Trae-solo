import api from './index'

export const packageApi = {
  
  getList: (params) => {
    return api.get('/api/packages', { params })
  },

  getCategories: () => {
    return api.get('/api/packages/categories')
  },

  getDetail: (id) => {
    return api.get(`/api/packages/${id}`)
  },

  calculatePrice: (data) => {
    return api.post('/api/packages/calculate-price', data)
  }
}
