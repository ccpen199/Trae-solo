import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  retry: 1,
  retryDelay: 1000
})

let toastTimer = null
const showToast = (message, type = 'error') => {
  if (toastTimer) clearTimeout(toastTimer)
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.position = 'fixed'
  toast.style.top = '50%'
  toast.style.left = '50%'
  toast.style.transform = 'translate(-50%, -50%)'
  toast.style.background = type === 'success' ? 'rgba(7, 193, 96, 0.95)' : 'rgba(0, 0, 0, 0.85)'
  toast.style.color = 'white'
  toast.style.padding = '12px 24px'
  toast.style.borderRadius = '8px'
  toast.style.fontSize = '14px'
  toast.style.zIndex = '99999'
  toast.style.minWidth = '200px'
  toast.style.textAlign = 'center'
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  document.body.appendChild(toast)
  
  toastTimer = setTimeout(() => toast.remove(), 3000)
}

request.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const { data } = response
    if (!data.success) {
      showToast(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data.data
  },
  error => {
    const { config, response } = error
    const currentRetry = config.__retryCount || 0
    
    if (currentRetry < (config.retry || 1)) {
      config.__retryCount = currentRetry + 1
      return new Promise(resolve => {
        setTimeout(() => resolve(request(config)), config.retryDelay || 1000)
      })
    }
    
    let message = '网络请求失败'
    if (response) {
      switch (response.status) {
        case 401: message = '未授权'; break
        case 403: message = '无权限访问'; break
        case 404: message = '资源不存在'; break
        case 500: message = '服务器错误'; break
        default: message = response.data?.message || `请求失败 (${response.status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    }
    
    showToast(message)
    return Promise.reject(error)
  }
)

export const $message = { show: showToast }
export default request
