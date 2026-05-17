import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let retryCount = 0
const MAX_RETRY_COUNT = 1

service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    retryCount = 0
    return res
  },
  async (error) => {
    console.error('Response error:', error)
    
    const originalRequest = error.config
    const userStore = useUserStore()

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      if (retryCount < MAX_RETRY_COUNT) {
        retryCount++
        ElMessage.info('请求超时，正在重试...')
        return service(originalRequest)
      }
      ElMessage.error('请求超时，请检查网络连接')
      return Promise.reject(error)
    }

    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    const status = error.response.status

    switch (status) {
      case 401:
        await ElMessageBox.alert('登录已过期，请重新登录', '提示', {
          confirmButtonText: '确定',
          type: 'warning'
        })
        userStore.logout()
        window.location.href = '/login'
        break
      case 403:
        ElMessage.error('没有权限访问该资源')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误，请稍后重试')
        break
      default:
        ElMessage.error(error.response.data?.message || `请求错误 (${status})`)
    }

    return Promise.reject(error)
  }
)

export default service
