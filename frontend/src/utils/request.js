import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res && typeof res === 'object' && res.error) {
      console.error('后端返回错误:', res.error)
      ElMessage.error(res.error)
      return Promise.reject(new Error(res.error))
    }
    return res
  },
  error => {
    console.error('请求错误:', error)
    ElMessage.error(error.response?.data?.error || error.message || '请求失败，请稍后重试')
    return Promise.reject(error)
  }
)

export default request
