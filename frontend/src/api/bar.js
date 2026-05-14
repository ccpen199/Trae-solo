import request from '@/utils/request'

export const barApi = {
  getList(params) {
    return request.get('/bars', { params })
  },

  getDetail(id) {
    return request.get(`/bars/${id}`)
  },

  create(data) {
    return request.post('/bars', data)
  },

  update(id, data) {
    return request.put(`/bars/${id}`, data)
  },

  delete(id) {
    return request.delete(`/bars/${id}`)
  }
}
