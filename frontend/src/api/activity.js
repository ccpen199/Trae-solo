import request from './index'

// 获取当前进行中的活动
export const getActiveActivity = (type) => {
  return request.get(`/activities/active/${type}`)
}

// 获取最近中奖公告
export const getRecentWinners = (type, limit = 10) => {
  return request.get(`/activities/winners/${type}`, { params: { limit } })
}

// 获取活动列表（后台）
export const getActivityList = (params) => {
  return request.get('/activities', { params })
}

// 获取活动详情
export const getActivity = (id) => {
  return request.get(`/activities/${id}`)
}

// 创建活动
export const createActivity = (data) => {
  return request.post('/activities', data)
}

// 更新活动
export const updateActivity = (id, data) => {
  return request.put(`/activities/${id}`, data)
}

// 删除活动
export const deleteActivity = (id) => {
  return request.delete(`/activities/${id}`)
}
