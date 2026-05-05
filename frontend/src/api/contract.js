import api from './index'

export const contractApi = {
  
  getPreview: (orderId) => {
    return api.get(`/api/contracts/${orderId}/preview`)
  },

  generatePdf: (orderId) => {
    return api.post(`/api/contracts/${orderId}/generate`)
  },

  download: (fileName) => {
    return `/api/contracts/download/${fileName}`
  }
}
