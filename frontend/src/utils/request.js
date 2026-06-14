import axios from 'axios'

const baseURL = '/api'

const request = axios.create({
  baseURL,
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      config.headers['X-User-Id'] = userData.id
      config.headers['X-User-Role'] = userData.role
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code && res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
