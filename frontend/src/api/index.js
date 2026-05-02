import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const userUuid = localStorage.getItem('user_uuid')
    if (userUuid) {
      config.headers['X-User-UUID'] = userUuid
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.success) {
      return data
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message))
    }
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  getCurrentUser: () => api.get('/api/auth/me'),
  getRoles: () => api.get('/api/auth/roles')
}

export const taskApi = {
  getTaskStates: () => api.get('/api/tasks/states'),
  getTasks: (params) => api.get('/api/tasks', { params }),
  getTask: (taskUuid) => api.get(`/api/tasks/${taskUuid}`),
  createTask: (data) => api.post('/api/tasks', data),
  updateTask: (taskUuid, data) => api.put(`/api/tasks/${taskUuid}`, data),
  configureTask: (taskUuid) => api.post(`/api/tasks/${taskUuid}/configure`),
  publishTask: (taskUuid) => api.post(`/api/tasks/${taskUuid}/publish`),
  addTaskReward: (taskUuid, data) => api.post(`/api/tasks/${taskUuid}/rewards`, data)
}

export const progressApi = {
  triggerEvent: (data) => api.post('/api/events/trigger', data),
  getTriggerEvents: () => api.get('/api/events/triggers'),
  getUserProgress: (params) => api.get('/api/progress', { params }),
  getProgressDetail: (progressUuid) => api.get(`/api/progress/${progressUuid}`)
}

export const rewardApi = {
  getRewards: (params) => api.get('/api/rewards', { params }),
  createReward: (data) => api.post('/api/rewards', data),
  getUserRewards: (params) => api.get('/api/rewards/user', { params }),
  grantTaskRewards: (data) => api.post('/api/rewards/grant', data),
  deliverReward: (userRewardUuid) => api.post(`/api/rewards/${userRewardUuid}/deliver`)
}

export const achievementApi = {
  getAchievements: (params) => api.get('/api/achievements', { params }),
  createAchievement: (data) => api.post('/api/achievements', data),
  getUserAchievements: (params) => api.get('/api/achievements/user', { params }),
  addAchievementReward: (achievementUuid, data) => api.post(`/api/achievements/${achievementUuid}/rewards`, data)
}

export const reportApi = {
  getDashboard: (params) => api.get('/api/reports/dashboard', { params }),
  getTaskStats: (params) => api.get('/api/reports/task-stats', { params }),
  getProgressStats: (params) => api.get('/api/reports/progress-stats', { params }),
  getRewardStats: (params) => api.get('/api/reports/reward-stats', { params }),
  getConversionFunnel: (params) => api.get('/api/reports/conversion-funnel', { params }),
  getProcessingTime: (params) => api.get('/api/reports/processing-time', { params }),
  getExceptions: (params) => api.get('/api/reports/exceptions', { params }),
  getRevenue: (params) => api.get('/api/reports/revenue', { params }),
  getAuditTrails: (params) => api.get('/api/reports/audit-trails', { params }),
  getAuditTrail: (targetType, targetUuid) => api.get(`/api/reports/audit-trails/${targetType}/${targetUuid}`),
  getCrossReference: (sourceType, sourceUuid) => api.get(`/api/reports/cross-reference/${sourceType}/${sourceUuid}`)
}

export default api
