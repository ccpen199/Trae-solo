import request from '@/utils/request'

export const entryApi = {
  getList(params) {
    return request.get('/entries', { params })
  },

  getDetail(id) {
    return request.get(`/entries/${id}`)
  },

  create(data) {
    return request.post('/entries', data)
  },

  update(id, data) {
    return request.put(`/entries/${id}`, data)
  },

  delete(id) {
    return request.delete(`/entries/${id}`)
  }
}
