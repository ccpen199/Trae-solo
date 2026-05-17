import axios from 'axios'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let retryCount = 0
const MAX_RETRY = 1

api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    if (config.loading) {
      showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        duration: 0
      })
    }
    return config
  },
  (error) => {
    closeToast()
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    closeToast()
    if (response.data.success === false) {
      showToast(response.data.message || '请求失败')
      return Promise.reject(response.data)
    }
    return response.data
  },
  (error) => {
    closeToast()
    
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      if (retryCount < MAX_RETRY) {
        retryCount++
        return api(error.config)
      }
      showToast('请求超时，请稍后重试')
      return Promise.reject(error)
    }

    const status = error.response?.status
    const userStore = useUserStore()

    switch (status) {
      case 401:
        showToast('请先登录')
        userStore.logout()
        break
      case 403:
        showToast('没有权限')
        break
      case 404:
        showToast('资源不存在')
        break
      case 500:
        showToast('服务器错误')
        break
      default:
        if (!error.response) {
          showToast('网络连接失败')
        } else {
          showToast(error.response?.data?.message || '请求失败')
        }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  getPrivacyPolicy: () => api.get('/auth/privacy-policy'),
  sendCode: (contact) => api.post('/auth/send-code', { contact }),
  verifyCode: (contact, code) => api.post('/auth/verify-code', { contact, code }),
  register: (data) => api.post('/auth/register', data),
  login: (contact, password) => api.post('/auth/login', { contact, password }),
  getProfile: () => api.get('/auth/profile', { loading: true })
}

export const poemsApi = {
  getCategories: () => api.get('/poems/categories'),
  getExcerpts: (params) => api.get('/poems/excerpts', { params, loading: params?.loading }),
  getPoem: (id) => api.get(`/poems/${id}`, { loading: true }),
  getExcerptSettings: () => api.get('/poems/settings/excerpt'),
  saveExcerptSettings: (categories) => api.post('/poems/settings/excerpt', { categories }),
  toggleFavorite: (id) => api.post(`/poems/${id}/favorite`),
  getFavorites: (params) => api.get('/poems/favorites/list', { params, loading: true })
}

export const communityApi = {
  getChannels: () => api.get('/community/channels'),
  getMyChannels: () => api.get('/community/my-channels'),
  joinChannel: (channelId) => api.post(`/community/channels/${channelId}/join`),
  sortChannels: (channelIds) => api.post('/community/channels/sort', { channelIds }),
  getPosts: (params) => api.get('/community/posts', { params, loading: params?.loading }),
  getFollowingPosts: (params) => api.get('/community/following/posts', { params, loading: true }),
  getPost: (id) => api.get(`/community/posts/${id}`, { loading: true }),
  createPost: (data) => api.post('/community/posts', data, { loading: true }),
  likePost: (id) => api.post(`/community/posts/${id}/like`),
  getComments: (postId, params) => api.get(`/community/posts/${postId}/comments`, { params }),
  createComment: (postId, content) => api.post(`/community/posts/${postId}/comments`, { content }, { loading: true }),
  rewardPost: (id, amount, message) => api.post(`/community/posts/${id}/reward`, { amount, message }, { loading: true })
}

export const userApi = {
  getProfile: () => api.get('/user/profile', { loading: true }),
  updateProfile: (data) => api.put('/user/profile', data, { loading: true }),
  getUserProfile: (userId) => api.get(`/user/${userId}`),
  followUser: (userId) => api.post(`/user/${userId}/follow`),
  getFollowing: (params) => api.get('/user/following/list', { params, loading: true }),
  getFollowers: (params) => api.get('/user/followers/list', { params, loading: true })
}

export default api
