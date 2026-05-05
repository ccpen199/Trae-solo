import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    
    if (error.response) {
      const message = error.response.data?.message || '请求失败'
      ElMessage.error(message)
    } else if (error.request) {
      ElMessage.error('网络错误，请检查服务器是否启动')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default api
