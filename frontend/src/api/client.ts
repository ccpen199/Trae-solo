import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client

export const register = (data: any) => client.post('/auth/register', data)
export const login = (data: any) => client.post('/auth/login', data)
export const getProfile = () => client.get('/auth/profile')
export const updateProfile = (data: any) => client.put('/auth/profile', data)
export const updateLocation = (data: any) => client.put('/auth/location', data)
export const bindDeviceFingerprint = (data: any) => client.post('/auth/device-fingerprint', data)

export const getNews = (params?: any) => client.get('/news', { params })
export const getNearbyNews = (lat: number, lng: number, radius = 5, page = 1, limit = 20) =>
  client.get('/news/nearby', { params: { lat, lng, radius, page, limit } })
export const getHotspotNews = (lat: number, lng: number, page = 1, limit = 10) =>
  client.get('/news/hotspot', { params: { lat, lng, page, limit } })
export const getNewsDetail = (id: string) => client.get(`/news/${id}`)
export const createNews = (data: any) => client.post('/news', data)
export const likeNews = (id: string) => client.post(`/news/${id}/like`)
export const getNewsRecommendations = (page = 1, limit = 20) =>
  client.get('/news/recommendations', { params: { page, limit } })

export const getVideos = (params?: any) => client.get('/video', { params })
export const getNearbyVideos = (lat: number, lng: number, radius = 5, page = 1, limit = 20) =>
  client.get('/video/nearby', { params: { lat, lng, radius, page, limit } })
export const getVideoDetail = (id: string) => client.get(`/video/${id}`)
export const createVideo = (data: any) => client.post('/video', data)
export const likeVideo = (id: string) => client.post(`/video/${id}/like`)
export const reportPlayEvent = (id: string, data: any) => client.post(`/video/${id}/play-event`, data)
export const getVideoRecommendations = (page = 1, limit = 20) =>
  client.get('/video/recommendations', { params: { page, limit } })

export const getCreators = (params?: any) => client.get('/creator', { params })
export const getCreatorDetail = (id: string) => client.get(`/creator/${id}`)
export const applyCreator = (data: any) => client.post('/creator/apply', data)
export const updateCreator = (id: string, data: any) => client.put(`/creator/${id}`, data)
export const getCreatorContent = (id: string, params?: any) => client.get(`/creator/${id}/content`, { params })
export const followCreator = (id: string) => client.post(`/creator/${id}/follow`)
export const getCreatorStats = (id: string) => client.get(`/creator/${id}/stats`)

export const getTasks = () => client.get('/task')
export const getTaskDetail = (id: string) => client.get(`/task/${id}`)
export const completeTask = (id: string, data?: any) => client.post(`/task/${id}/complete`, data)
export const claimTaskReward = (id: string) => client.post(`/task/${id}/claim`)
export const getBeanBalance = () => client.get('/task/beans/balance')
export const getBeanTransactions = (params?: any) => client.get('/task/beans/transactions', { params })
export const exchangeBeans = (amount: number) => client.post('/task/beans/exchange', { amount })
export const getExchangeRate = () => client.get('/task/beans/exchange-rate')

export const getDashboard = () => client.get('/admin/dashboard')
export const getRegionHeat = () => client.get('/admin/region-heat')
export const getContentReports = (params?: any) => client.get('/admin/content-reports', { params })
export const reviewContentReport = (id: string, data: any) => client.put(`/admin/content-reports/${id}`, data)
export const getCreatorGrowth = () => client.get('/admin/creator-growth')
export const adjustCreatorLevel = (id: string, level: number) => client.put(`/admin/creators/${id}/level`, { level })
export const getAntiFraudStats = () => client.get('/admin/anti-fraud/stats')
export const getSuspiciousBehaviors = (params?: any) => client.get('/admin/anti-fraud/suspicious', { params })
export const getUsers = (params?: any) => client.get('/admin/users', { params })
