import api from './index'

export const cartApi = {
  
  getCart: () => {
    return api.get('/api/cart')
  },

  addPackage: (data) => {
    return api.post('/api/cart/package', data)
  },

  addAccessory: (data) => {
    return api.post('/api/cart/accessory', data)
  },

  addUpgrade: (data) => {
    return api.post('/api/cart/upgrade', data)
  },

  updateItem: (itemId, data) => {
    return api.put(`/api/cart/items/${itemId}`, data)
  },

  removeItem: (itemId) => {
    return api.delete(`/api/cart/items/${itemId}`)
  },

  clearCart: () => {
    return api.delete('/api/cart')
  },

  getTotal: () => {
    return api.get('/api/cart/total')
  }
}
