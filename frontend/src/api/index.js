import request from '@/utils/request'

export const auth = {
  login(data) {
    return request({ url: '/auth/login', method: 'post', data })
  },
  logout() {
    return request({ url: '/auth/logout', method: 'post' })
  },
  getProfile() {
    return request({ url: '/auth/profile', method: 'get' })
  },
  updateProfile(data) {
    return request({ url: '/auth/profile', method: 'put', data })
  },
  updatePassword(data) {
    return request({ url: '/auth/password', method: 'put', data })
  }
}

export const company = {
  getInfo() {
    return request({ url: '/company/info', method: 'get' })
  },
  updateInfo(data) {
    return request({ url: '/company/info', method: 'put', data })
  },
  getCredit() {
    return request({ url: '/company/credit', method: 'get' })
  },
  getVerification(code) {
    return request({ url: '/company/verification', method: 'get', params: { credit_code: code } })
  }
}

export const jobs = {
  getList(params) {
    return request({ url: '/jobs', method: 'get', params })
  },
  getDetail(id) {
    return request({ url: `/jobs/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/jobs', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/jobs/${id}`, method: 'put', data })
  },
  publish(id) {
    return request({ url: `/jobs/${id}/publish`, method: 'post' })
  },
  unpublish(id) {
    return request({ url: `/jobs/${id}/offline`, method: 'post' })
  },
  delete(id) {
    return request({ url: `/jobs/${id}`, method: 'delete' })
  },
  getTemplates() {
    return request({ url: '/jobs/templates', method: 'get' })
  },
  createTemplate(data) {
    return request({ url: '/jobs/templates', method: 'post', data })
  },
  getTags() {
    return request({ url: '/jobs/tags', method: 'get' })
  },
  getHotAreas() {
    return request({ url: '/jobs/hot/areas', method: 'get' })
  }
}

export const candidates = {
  getList(params) {
    return request({ url: '/candidates', method: 'get', params })
  },
  getDetail(id) {
    return request({ url: `/candidates/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/candidates', method: 'post', data })
  },
  uploadResume(formData) {
    return request({ url: '/candidates/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
  },
  match(jobId, candidateId) {
    return request({ url: `/candidates/match/${jobId}/${candidateId}`, method: 'post' })
  },
  batchMatch(jobId) {
    return request({ url: `/candidates/batch-match/${jobId}`, method: 'post' })
  }
}

export const applications = {
  getList(params) {
    return request({ url: '/applications', method: 'get', params })
  },
  getDetail(id) {
    return request({ url: `/applications/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/applications', method: 'post', data })
  },
  updateStatus(id, status) {
    return request({ url: `/applications/${id}/status`, method: 'put', data: { status } })
  },
  updateRemark(id, remark) {
    return request({ url: `/applications/${id}/note`, method: 'post', data: { note: remark } })
  },
  batchAction(ids, action, data) {
    return request({ url: '/applications/batch-action', method: 'post', data: { ids, action, ...data } })
  },
  getFunnel(params) {
    return request({ url: '/applications/funnel/stats', method: 'get', params })
  }
}

export const interviews = {
  getList(params) {
    return request({ url: '/interviews', method: 'get', params })
  },
  getDetail(id) {
    return request({ url: `/interviews/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/interviews', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/interviews/${id}`, method: 'put', data })
  },
  start(id) {
    return request({ url: `/interviews/${id}/start`, method: 'post' })
  },
  end(id, data) {
    return request({ url: `/interviews/${id}/end`, method: 'post', data })
  },
  cancel(id) {
    return request({ url: `/interviews/${id}/cancel`, method: 'post' })
  },
  getRoom(roomId) {
    return request({ url: `/interviews/room/${roomId}`, method: 'get' })
  }
}

export const offers = {
  getList(params) {
    return request({ url: '/offers', method: 'get', params })
  },
  getDetail(id) {
    return request({ url: `/offers/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/offers', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/offers/${id}`, method: 'put', data })
  },
  send(id) {
    return request({ url: `/offers/${id}/send`, method: 'post' })
  },
  sign(token, data) {
    return request({ url: `/offers/sign/${token}`, method: 'post', data })
  },
  reject(id) {
    return request({ url: `/offers/${id}/decline`, method: 'post' })
  },
  withdraw(id) {
    return request({ url: `/offers/${id}/withdraw`, method: 'post' })
  },
  getOnboarding(offerId) {
    return request({ url: `/offers/onboarding/list/${offerId}`, method: 'get' })
  },
  updateOnboardingTask(taskId, data) {
    return request({ url: `/offers/onboarding/${taskId}`, method: 'put', data })
  }
}

export const analytics = {
  getDashboard() {
    return request({ url: '/analytics/dashboard', method: 'get' })
  },
  getFunnel(params) {
    return request({ url: '/analytics/funnel', method: 'get', params })
  },
  getChannelROI(params) {
    return request({ url: '/analytics/channel/roi', method: 'get', params })
  },
  getJobPerformance(params) {
    return request({ url: '/analytics/jobs/performance', method: 'get', params })
  },
  getHotAreas(params) {
    return request({ url: '/analytics/hot/areas', method: 'get', params })
  },
  getCandidateSources(params) {
    return request({ url: '/analytics/candidates/source', method: 'get', params })
  },
  getTrend(params) {
    return request({ url: '/analytics/trend', method: 'get', params })
  },
  getChannels() {
    return request({ url: '/analytics/channels', method: 'get' })
  }
}
