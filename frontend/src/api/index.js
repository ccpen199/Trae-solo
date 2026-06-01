import request from './request'

export const authApi = {
  login: data => request.post('/auth/login', data),
  register: data => request.post('/auth/register', data),
  logout: () => request.post('/auth/logout')
}

export const goalApi = {
  getDimensions: () => request.get('/goals/dimensions'),
  getGoals: params => request.get('/goals', { params }),
  getGoalDetail: id => request.get(`/goals/${id}`),
  createGoal: data => request.post('/goals', data),
  updateGoal: (id, data) => request.put(`/goals/${id}`, data),
  deleteGoal: id => request.delete(`/goals/${id}`),
  createKR: (goalId, data) => request.post(`/goals/${goalId}/key-results`, data),
  updateKR: (id, data) => request.put(`/goals/key-results/${id}`, data),
  deleteKR: id => request.delete(`/goals/key-results/${id}`)
}

export const executionApi = {
  getWeeklyPlans: params => request.get('/execution/weekly-plans', { params }),
  getCurrentWeekPlan: () => request.get('/execution/weekly-plans/current'),
  createWeeklyPlan: data => request.post('/execution/weekly-plans', data),
  createWeeklyTask: (planId, data) => request.post(`/execution/weekly-plans/${planId}/tasks`, data),
  updateWeeklyTask: (taskId, data) => request.put(`/execution/weekly-tasks/${taskId}`, data),
  deleteWeeklyTask: taskId => request.delete(`/execution/weekly-tasks/${taskId}`),
  createMilestone: data => request.post('/execution/milestones', data),
  updateMilestone: (id, data) => request.put(`/execution/milestones/${id}`, data),
  deleteMilestone: id => request.delete(`/execution/milestones/${id}`),
  createExecutionRecord: data => request.post('/execution/execution-records', data),
  getHabits: () => request.get('/execution/habits'),
  createHabit: data => request.post('/execution/habits', data),
  checkinHabit: (habitId, data) => request.post(`/execution/habits/${habitId}/checkin`, data),
  deleteHabit: habitId => request.delete(`/execution/habits/${habitId}`)
}

export const deviationApi = {
  getDeviationTypes: () => request.get('/deviation/types'),
  getDeviations: params => request.get('/deviation', { params }),
  createDeviation: data => request.post('/deviation', data),
  updateDeviation: (id, data) => request.put(`/deviation/${id}`, data),
  deleteDeviation: id => request.delete(`/deviation/${id}`),
  getAnnualReview: year => request.get(`/deviation/annual-review/${year}`),
  saveAnnualReview: data => request.post('/deviation/annual-review', data)
}

export const exportApi = {
  getReport: (year, params) => request.get(`/export/report/${year}`, { params }),
  getYears: () => request.get('/export/years')
}

export const adminApi = {
  getStats: () => request.get('/admin/stats'),
  getUsers: () => request.get('/admin/users'),
  updateUser: (id, data) => request.put(`/admin/users/${id}`, data),
  getOperationLogs: params => request.get('/admin/operation-logs', { params }),
  getOperations: () => request.get('/admin/operations'),
  getSystemInfo: () => request.get('/admin/system-info'),
  cleanup: data => request.post('/admin/maintenance/cleanup', data)
}
