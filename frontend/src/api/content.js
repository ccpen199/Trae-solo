import request from '@/utils/request'

export const contentApi = {
  getByEntry(entryId) {
    return request.get(`/contents/entry/${entryId}`)
  },

  create(data) {
    return request.post('/contents', data)
  },

  batchCreate(data) {
    return request.post('/contents/batch', data)
  },

  update(id, data) {
    return request.put(`/contents/${id}`, data)
  },

  delete(id) {
    return request.delete(`/contents/${id}`)
  }
}
