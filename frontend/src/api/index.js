import { message } from 'antd'

const BASE_URL = '/api'

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.id) {
        headers['x-user-id'] = String(user.id)
      }
    } catch {}
  }
  return headers
}

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const config = {
    headers: getHeaders(),
    ...options,
  }
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }
  try {
    const response = await fetch(fullUrl, config)
    const data = await response.json()
    if (!response.ok) {
      const errMsg = data.message || data.error || `请求失败 (${response.status})`
      return { success: false, message: errMsg, status: response.status, data: null }
    }
    if (data.success === false) {
      return { success: false, message: data.message || '操作失败', status: response.status, data: null }
    }
    const resultData = data.data !== undefined ? data.data : data
    return { success: true, data: resultData, status: 200 }
  } catch (err) {
    return { success: false, message: '网络请求异常，请检查网络连接', status: 0, data: null }
  }
}

export const api = {
  get: (url, params) => {
    let query = ''
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val)
        }
      })
      const qs = searchParams.toString()
      if (qs) query = `?${qs}`
    }
    return request(`${url}${query}`, { method: 'GET' })
  },

  post: (url, body) => request(url, { method: 'POST', body }),

  put: (url, body) => request(url, { method: 'PUT', body }),

  delete: (url) => request(url, { method: 'DELETE' }),
}

export default api
