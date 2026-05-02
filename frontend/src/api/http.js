import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        config.headers['X-User-Id'] = userData.id
        config.headers['X-User-Role'] = userData.role
      } catch (e) {
        console.error('Parse user error:', e)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.success) {
      return data
    } else {
      let errorMessage = data.message || '请求失败'
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const errorDetails = data.errors
          .map(e => {
            if (e.msg && e.path) {
              return `${e.path}: ${e.msg}`
            } else if (e.msg) {
              return e.msg
            }
            return e
          })
          .join('；')
        errorMessage = errorDetails
      }
      return Promise.reject(new Error(errorMessage))
    }
  },
  (error) => {
    let message = '网络错误'
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录'
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          const responseData = error.response.data
          if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            const errorDetails = responseData.errors
              .map(e => {
                if (e.msg && e.path) {
                  return `${e.path}: ${e.msg}`
                } else if (e.msg) {
                  return e.msg
                }
                return e
              })
              .join('；')
            message = errorDetails
          } else {
            message = responseData?.message || `请求失败 (${error.response.status})`
          }
      }
    } else if (error.request) {
      message = '网络连接失败，请检查网络'
    }
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  }
)

export default http
