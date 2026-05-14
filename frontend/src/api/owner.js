import request from '@/utils/request'

export const ownerApi = {
  getList(params) {
    return request.get('/owners', { params })
  },

  create(data) {
    return request.post('/owners', data)
  },

  updateStatus(id, status) {
    return request.put(`/owners/${id}/status`, { status })
  },

  delete(id) {
    return request.delete(`/owners/${id}`)
  }
}
