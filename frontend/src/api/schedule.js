import request from './request.js'

export const getSchedules = (params) => {
  return request.get('/schedules', { params })
}

export const getSchedule = (id) => {
  return request.get(`/schedules/${id}`)
}

export const createSchedule = (data) => {
  return request.post('/schedules', data)
}

export const updateSchedule = (id, data) => {
  return request.put(`/schedules/${id}`, data)
}

export const deleteSchedule = (id) => {
  return request.delete(`/schedules/${id}`)
}

export const toggleSchedule = (id, enabled) => {
  return request.put(`/schedules/${id}/toggle`, { enabled })
}

export const executeSchedule = (id) => {
  return request.post(`/schedules/${id}/execute`)
}
