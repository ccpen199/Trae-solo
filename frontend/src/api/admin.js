import request from '@/utils/request'

export const adminApi = {
  getStats() {
    return request.get('/admin/stats')
  },

  getLogs(params) {
    return request.get('/admin/logs', { params })
  },

  getHealth() {
    return request.get('/admin/health')
  }
}
