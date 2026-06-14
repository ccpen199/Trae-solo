import request from '@/utils/request'

export const getScheduleList = (params) => {
  return request({
    url: '/schedules',
    method: 'get',
    params
  })
}

export const getScheduleDetail = (id) => {
  return request({
    url: `/schedules/${id}`,
    method: 'get'
  })
}

export const createSchedule = (data) => {
  return request({
    url: '/schedules',
    method: 'post',
    data
  })
}

export const updateSchedule = (id, data) => {
  return request({
    url: `/schedules/${id}`,
    method: 'put',
    data
  })
}

export const startSchedule = (id) => {
  return request({
    url: `/schedules/${id}/start`,
    method: 'post'
  })
}

export const completeSchedule = (id) => {
  return request({
    url: `/schedules/${id}/complete`,
    method: 'post'
  })
}

export const optimizeRoute = (data) => {
  return request({
    url: '/schedules/optimize-route',
    method: 'post',
    data
  })
}
