import request from '@/utils/request'

export function getMessages(params) {
  return request.get('/messages', { params })
}

export function getUnreadCount() {
  return request.get('/messages/unread-count')
}

export function markAsRead(id) {
  return request.post(`/messages/${id}/read`)
}

export function markAllAsRead() {
  return request.post('/messages/read-all')
}
