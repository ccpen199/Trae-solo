import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58858/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

export const healthCheck = () => api.get('/health')
export const getBuildings = () => api.get('/buildings')
export const getEnterprises = (params) => api.get('/enterprises', { params })
export const addEnterprise = (data) => api.post('/enterprises', data)
export const updateEnterprise = (id, data) => api.put(`/enterprises/${id}`, data)
export const getMeters = (params) => api.get('/meters', { params })
export const addMeter = (data) => api.post('/meters', data)
export const changeMeter = (id, data) => api.post(`/meters/${id}/change`, data)
export const getMeterChanges = (id) => api.get(`/meters/${id}/changes`)
export const getMeterReadings = (params) => api.get('/meter-readings', { params })
export const addMeterReadings = (data) => api.post('/meter-readings', data)
export const reviewReading = (id, data) => api.put(`/meter-readings/${id}/review`, data)
export const getAllocationRules = (params) => api.get('/allocation-rules', { params })
export const addAllocationRule = (data) => api.post('/allocation-rules', data)
export const getEnergyPrices = () => api.get('/energy-prices')
export const getBills = (params) => api.get('/bills', { params })
export const getBillDetail = (id) => api.get(`/bills/${id}`)
export const generateBills = (data) => api.post('/bills/generate', data)
export const confirmBill = (id, data) => api.put(`/bills/${id}/confirm`, data)
export const payBill = (id, data) => api.put(`/bills/${id}/pay`, data)
export const recalculateBill = (id) => api.post(`/bills/${id}/recalculate`)
export const getDashboardStats = () => api.get('/dashboard/stats')

export const energyTypeMap = {
  electricity: '电',
  water: '水',
  gas: '气',
  cooling: '空调'
}

export const allocationTypeMap = {
  direct: '直抄',
  area: '面积分摊',
  workstation: '工位分摊',
  public: '公共区域'
}

export default api
