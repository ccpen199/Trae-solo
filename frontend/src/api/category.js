import request from '@/utils/request'

export const categoryApi = {
  getList() {
    return request.get('/categories')
  },

  getTree() {
    return request.get('/categories/tree')
  },

  create(data) {
    return request.post('/categories', data)
  },

  getLeafNodes(params) {
    return request.get('/categories/leaf-nodes', { params })
  },

  createLeafNode(data) {
    return request.post('/categories/leaf-nodes', data)
  }
}
