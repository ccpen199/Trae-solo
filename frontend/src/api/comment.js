import api from './index'

export const commentApi = {
  
  getList: (packageId, params) => {
    return api.get(`/api/packages/${packageId}/comments`, { params })
  },

  create: (data) => {
    return api.post('/api/comments', data)
  },

  getMyComments: (params) => {
    return api.get('/api/comments/my', { params })
  },

  like: (commentId) => {
    return api.post(`/api/comments/${commentId}/like`)
  },

  reply: (commentId, data) => {
    return api.post(`/api/comments/${commentId}/reply`, data)
  },

  remove: (commentId) => {
    return api.delete(`/api/comments/${commentId}`)
  }
}
