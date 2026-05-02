import axios from 'axios'

const API_BASE_URL = 'http://localhost:8099/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 批次管理
export const batchApi = {
  create: (data) => api.post('/batches', data),
  getById: (uid) => api.get(`/batches/${uid}`),
  getByCode: (code) => api.get(`/batches/code/${code}`),
  getByFarmer: (farmerUid) => api.get(`/batches/farmer/${farmerUid}`),
  search: (params) => api.get('/batches', { params }),
  transition: (uid, event, context) => api.post(`/batches/${uid}/transition`, { event, context }),
  updateQuantity: (uid, quantity) => api.put(`/batches/${uid}/quantity`, { actual_quantity: quantity }),
  enableTags: (uid, count) => api.post(`/batches/${uid}/enable-tags`, { tags_count: count })
}

// 农事作业
export const farmingApi = {
  create: (data) => api.post('/farming/records', data),
  getById: (uid) => api.get(`/farming/records/${uid}`),
  getByBatch: (batchUid, params) => api.get(`/farming/batch/${batchUid}`, { params }),
  getSummary: (batchUid) => api.get(`/farming/batch/${batchUid}/summary`),
  verifyTimestamp: (uid) => api.get(`/farming/records/${uid}/verify-timestamp`),
  addPhoto: (uid, photoUrl, description) => api.post(`/farming/records/${uid}/photos`, { photo_url: photoUrl, photo_description: description })
}

// 质检管理
export const qualityApi = {
  create: (data) => api.post('/quality/inspections', data),
  getById: (uid) => api.get(`/quality/inspections/${uid}`),
  getByCode: (code) => api.get(`/quality/inspections/code/${code}`),
  getByBatch: (batchUid, params) => api.get(`/quality/batch/${batchUid}`, { params }),
  startTesting: (uid) => api.post(`/quality/inspections/${uid}/start-testing`),
  submitResults: (uid, data) => api.post(`/quality/inspections/${uid}/submit-results`, data),
  requestReInspection: (uid, reason) => api.post(`/quality/inspections/${uid}/re-inspection`, { reason }),
  reject: (uid, reason) => api.post(`/quality/inspections/${uid}/reject`, { reason }),
  getHistory: (batchUid) => api.get(`/quality/batch/${batchUid}/history`),
  getStandards: () => api.get('/quality/rules/standards'),
  evaluate: (pesticideResults) => api.post('/quality/rules/evaluate', pesticideResults)
}

// 流通管理
export const flowApi = {
  create: (data) => api.post('/flow/records', data),
  getById: (uid) => api.get(`/flow/records/${uid}`),
  getByScanCode: (code) => api.get(`/flow/scan/${code}`),
  getByBatch: (batchUid, params) => api.get(`/flow/batch/${batchUid}`, { params }),
  getSummary: (batchUid) => api.get(`/flow/batch/${batchUid}/summary`),
  getLocations: (batchUid) => api.get(`/flow/batch/${batchUid}/locations`),
  getCurrentNode: (batchUid) => api.get(`/flow/current-node/${batchUid}`),
  verifyTimestamp: (uid) => api.get(`/flow/records/${uid}/verify-timestamp`),
  getBatchesAtNode: (node) => api.get(`/flow/node/${node}/batches`)
}

// 消费者端
export const consumerApi = {
  trace: (batchCode) => api.get(`/consumer/trace/${batchCode}`)
}

// 召回管理
export const recallApi = {
  create: (data) => api.post('/recall', data),
  getById: (uid) => api.get(`/recall/${uid}`),
  getByCode: (code) => api.get(`/recall/code/${code}`),
  getActive: () => api.get('/recall/active'),
  locateBatches: (data) => api.post('/recall/locate-batches', data),
  locateTerminals: (batchUid) => api.get(`/recall/locate-terminals/${batchUid}`),
  approve: (uid, approvalUid, approvalName) => api.post(`/recall/${uid}/approve`, { approval_uid: approvalUid, approval_name: approvalName }),
  start: (uid) => api.post(`/recall/${uid}/start`),
  updateProgress: (uid, recovered, disposed) => api.post(`/recall/${uid}/update-progress`, { recovered_quantity: recovered, disposed_quantity: disposed }),
  getSummary: (uid) => api.get(`/recall/${uid}/summary`)
}

// 失败补偿
export const compensationApi = {
  getByBatch: (batchUid) => api.get(`/compensation/batch/${batchUid}`),
  getPending: (params) => api.get('/compensation/pending', { params }),
  process: (uid) => api.post(`/compensation/${uid}/process`),
  skip: (uid, reason) => api.post(`/compensation/${uid}/skip`, { reason }),
  manuallyResolve: (uid, data) => api.post(`/compensation/${uid}/resolve`, data),
  getStatistics: (params) => api.get('/compensation/statistics', { params })
}

// 验收口径
export const acceptanceApi = {
  getCriteria: (category) => api.get(`/acceptance/criteria`, { params: { category } }),
  runCheck: (batchUid, category) => api.post(`/acceptance/check/${batchUid}`, { category }),
  getReport: (batchUid) => api.get(`/acceptance/report/${batchUid}`)
}

// 健康检查
export const healthApi = {
  status: () => api.get('/health/status'),
  info: () => api.get('/health/info')
}

export default api
