import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE || '/api'

const toastMessages = {
  queue: [],
  show(message, type = 'info') {
    const id = Date.now()
    this.queue.push({ id, message, type })
    this.render()
    setTimeout(() => {
      this.queue = this.queue.filter(t => t.id !== id)
      this.render()
    }, 3000)
  },
  render() {
    let container = document.getElementById('toast-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toast-container'
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;'
      document.body.appendChild(container)
    }
    container.innerHTML = this.queue.map(t => `
      <div style="padding:12px 20px;background:${t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#22c55e' : '#3b82f6'};color:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
        ${t.message}
      </div>
    `).join('')
  }
}

export const showToast = (msg, type) => toastMessages.show(msg, type)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
})

let retryCount = 0

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pmcaff_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    retryCount = 0
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    if (!error.response) {
      showToast('网络连接失败，请检查网络', 'error')
      return Promise.reject(error)
    }

    const { status, data } = error.response

    if (status === 401) {
      localStorage.removeItem('pmcaff_token')
      localStorage.removeItem('pmcaff_user')
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        showToast('登录已过期，请重新登录', 'error')
        setTimeout(() => window.location.href = '/login', 1000)
      }
      return Promise.reject(error)
    }

    if (status === 403) {
      showToast(data?.message || '无权限访问', 'error')
      return Promise.reject(error)
    }

    if (status === 404) {
      return Promise.reject(error)
    }

    if (status >= 500 && retryCount < 1) {
      retryCount++
      return api(originalRequest)
    }

    if (error.code === 'ECONNABORTED') {
      showToast('请求超时，请重试', 'error')
    } else {
      showToast(data?.message || '请求失败', 'error')
    }

    return Promise.reject(error)
  }
)

export default api
