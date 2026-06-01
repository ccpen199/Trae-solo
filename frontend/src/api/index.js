import axios from 'axios'

const API_BASE_URL = '/api'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

export const getAlarmList = (params) => request.get('/alarms', { params })
export const getAlarmById = (id) => request.get(`/alarms/${id}`)
export const createAlarm = (data) => request.post('/alarms', data)
export const markFalseAlarm = (id, data) => request.post(`/alarms/${id}/false-alarm`, data)
export const getRecommend = (alarmId, payload = {}) => request.post(`/alarms/${alarmId}/recommend`, payload)

export const getDispatchList = (params) => request.get('/dispatches', { params })
export const getDispatchById = (id) => request.get(`/dispatches/${id}`)
export const createDispatch = (data) => request.post('/dispatches', data)
export const markDispatchArrive = (id, data) => request.post(`/dispatches/${id}/arrive`, data)
export const markDispatchTimeout = (id, data) => request.post(`/dispatches/${id}/timeout`, data)

export const getSceneUpdates = (params) => request.get('/scene-updates', { params })
export const createSceneUpdate = (data) => request.post('/scene-updates', data)

export const getTimeline = (alarmId) => request.get(`/timeline/${alarmId}`)

export const getReportSummary = (params) => request.get('/reports/summary', { params })

export const getStationList = (params) => request.get('/stations', { params })
export const getVehicleList = (params) => request.get('/vehicles', { params })
export const getFirefighterList = (params) => request.get('/firefighters', { params })
export const getKeyLocations = (params) => request.get('/key-locations', { params })

export const getHealth = () => request.get('/health')

export default request
