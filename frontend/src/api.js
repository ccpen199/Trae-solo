import axios from 'axios'
import { message } from 'antd'
import useStore from './store'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    const { success, data, message: msg } = response.data
    if (success) {
      return data
    } else {
      message.error(msg || '请求失败')
      return Promise.reject(new Error(msg || '请求失败'))
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          useStore.getState().logout()
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(data?.message || error.message || '请求失败')
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接')
    } else {
      message.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

const retryWrapper = (fn, retries = 1) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (retries > 0 && !error.response?.status?.toString().startsWith('4')) {
        return retryWrapper(fn, retries - 1)(...args)
      }
      throw error
    }
  }
}

export const authApi = {
  login: retryWrapper((account, password) => api.post('/auth/login', { account, password })),
  register: retryWrapper((data) => api.post('/auth/register', data)),
  thirdPartyLogin: retryWrapper((data) => api.post('/auth/third-party', data)),
  getCurrentUser: retryWrapper(() => api.get('/auth/me')),
}

export const bookApi = {
  getBooks: retryWrapper((params) => api.get('/books', { params })),
  getBookDetail: retryWrapper((id) => api.get(`/books/${id}`)),
  getChapterContent: retryWrapper((bookId, chapterId) => api.get(`/books/${bookId}/chapters/${chapterId}`)),
  getCategories: retryWrapper(() => api.get('/categories')),
  getRecommendBooks: retryWrapper((limit) => api.get('/recommend/books', { params: { limit } })),
  getTopics: retryWrapper(() => api.get('/topics')),
  getAdvertisements: retryWrapper(() => api.get('/advertisements')),
}

export const searchApi = {
  saveHistory: retryWrapper((keyword) => api.post('/search/history', { keyword })),
  getHistory: retryWrapper(() => api.get('/search/history')),
  clearHistory: retryWrapper(() => api.delete('/search/history')),
}

export const borrowApi = {
  borrowBook: retryWrapper((bookId) => api.post('/borrow', { bookId })),
  returnBook: retryWrapper((bookId) => api.post('/return', { bookId })),
  getRecords: retryWrapper((params) => api.get('/borrow/records', { params })),
  checkStatus: retryWrapper((bookId) => api.get(`/borrow/check/${bookId}`)),
}

export const readerApi = {
  saveProgress: retryWrapper((data) => api.post('/reader/progress', data)),
  getProgress: retryWrapper((bookId) => api.get(`/reader/progress/${bookId}`)),
  addBookmark: retryWrapper((data) => api.post('/reader/bookmark', data)),
  getBookmarks: retryWrapper((bookId) => api.get(`/reader/bookmarks/${bookId}`)),
  deleteBookmark: retryWrapper((id) => api.delete(`/reader/bookmark/${id}`)),
  addNote: retryWrapper((data) => api.post('/reader/note', data)),
  getNotes: retryWrapper((bookId) => api.get(`/reader/notes/${bookId}`)),
  updateNote: retryWrapper((id, data) => api.put(`/reader/note/${id}`, data)),
  deleteNote: retryWrapper((id) => api.delete(`/reader/note/${id}`)),
}

export const userApi = {
  addToWishlist: retryWrapper((bookId) => api.post('/wishlist', { bookId })),
  removeFromWishlist: retryWrapper((bookId) => api.delete(`/wishlist/${bookId}`)),
  getWishlist: retryWrapper((params) => api.get('/wishlist', { params })),
  checkWishlist: retryWrapper((bookId) => api.get(`/wishlist/check/${bookId}`)),
  addToCloudLibrary: retryWrapper((bookId) => api.post('/cloud-library', { bookId })),
  removeFromCloudLibrary: retryWrapper((bookId) => api.delete(`/cloud-library/${bookId}`)),
  getCloudLibrary: retryWrapper((params) => api.get('/cloud-library', { params })),
  getUserNotes: retryWrapper((params) => api.get('/user/notes', { params })),
  getReadingStats: retryWrapper(() => api.get('/user/stats')),
  getMessages: retryWrapper((params) => api.get('/user/messages', { params })),
  markMessageRead: retryWrapper((id) => api.put(`/user/messages/${id}/read`)),
  getTasks: retryWrapper(() => api.get('/user/tasks')),
  updateProfile: retryWrapper((data) => api.put('/user/profile', data)),
}

export default api
