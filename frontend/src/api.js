import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

export const getHealth = () => api.get('/health')
export const getStats = () => api.get('/stats')
export const getLawyers = () => api.get('/lawyers')
export const getLawyer = (id) => api.get(`/lawyers/${id}`)
export const createLawyer = (data) => api.post('/lawyers', data)
export const getConsultations = () => api.get('/consultations')
export const getConsultation = (id) => api.get(`/consultations/${id}`)
export const createConsultation = (data) => api.post('/consultations', data)
export const triage = (content) => api.post('/triage', { content })
export const getContracts = () => api.get('/contracts')
export const createContract = (data) => api.post('/contracts', data)
export const getTemplates = () => api.get('/documents/templates')
export const generateDocument = (data) => api.post('/documents/generate', data)
export const getDocuments = () => api.get('/documents')
export const validateDocument = (data) => api.post('/documents/validate', data)
export const getAuditLogs = (params) => api.get('/audit', { params })
export const getQualityLawyers = () => api.get('/quality/lawyers')
export const getKnowledge = () => api.get('/knowledge')
export const getMessages = (consultationId) => api.get(`/messages/${consultationId}`)
export const sendMessage = (data) => api.post('/messages', data)

export default api
