import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        return res.data
      } else {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(res)
      }
    }
    return response.data
  },
  (error) => {
    console.error('Request error:', error)
    if (error.response) {
      ElMessage.error(error.response.data?.message || error.message)
    } else if (error.request) {
        ElMessage.error('网络连接失败，请检查后端服务')
    } else {
        ElMessage.error(error.message)
    }
    return Promise.reject(error)
  }
)

export default request
