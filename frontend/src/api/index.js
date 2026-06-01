import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:58799/api',
  timeout: 10000
})

export default api
