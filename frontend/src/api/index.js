import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export default {
  getHealth() {
    return api.get('/health')
  },
  getMaterialTypes() {
    return api.get('/material-types')
  },
  getServiceItems() {
    return api.get('/service-items')
  },
  getServiceItem(id) {
    return api.get('/service-items/' + id)
  },
  getApplicants(idCard) {
    return api.get('/applicants', { params: { id_card: idCard } })
  },
  createApplicant(data) {
    return api.post('/applicants', data)
  },
  getApplicantMaterials(applicantId) {
    return api.get('/applicants/' + applicantId + '/materials')
  },
  uploadMaterial(formData) {
    return api.post('/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  checkReusableMaterials(data) {
    return api.post('/applications/check-reusable', data)
  },
  createApplication(data) {
    return api.post('/applications', data)
  },
  getApplications(params) {
    return api.get('/applications', { params })
  },
  getApplication(id) {
    return api.get('/applications/' + id)
  },
  updateApplicationStatus(id, status) {
    return api.put('/applications/' + id + '/status', { status })
  },
  createAuthorization(data) {
    return api.post('/authorizations', data)
  },
  withdrawAuthorization(id, reason) {
    return api.put('/authorizations/' + id + '/withdraw', { reason })
  },
  getAuthorizations(params) {
    return api.get('/authorizations', { params })
  },
  createCorrection(data) {
    return api.post('/corrections', data)
  },
  resolveCorrection(id, data) {
    return api.put('/corrections/' + id + '/resolve', data)
  },
  getCorrections(params) {
    return api.get('/corrections', { params })
  },
  downloadMaterial(id) {
    window.open('/api/materials/' + id + '/download', '_blank')
  },
  login(data) {
    return api.post('/auth/login', data)
  }
}
