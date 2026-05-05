import api from './index'

export const accessoryApi = {
  
  getCategories: () => {
    return api.get('/api/accessories/categories')
  },

  getList: (params) => {
    return api.get('/api/accessories', { params })
  },

  getDetail: (id, params) => {
    return api.get(`/api/accessories/${id}`, { params })
  },

  getPackageAccessories: (packageId, params) => {
    return api.get(`/api/packages/${packageId}/accessories`, { params })
  },

  getUpgradePackages: () => {
    return api.get('/api/upgrades')
  },

  getUpgradePackageDetail: (id, params) => {
    return api.get(`/api/upgrades/${id}`, { params })
  }
}
