import request from '@/utils/request'

export const serviceItemApi = {
  list(params) {
    return request({ url: '/service-items', method: 'get', params })
  },
  hot(params) {
    return request({ url: '/service-items/hot', method: 'get', params })
  },
  detail(id) {
    return request({ url: `/service-items/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/service-items', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/service-items/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/service-items/${id}`, method: 'delete' })
  }
}

export const scenarioApi = {
  list(params) {
    return request({ url: '/scenarios', method: 'get', params })
  },
  detail(id) {
    return request({ url: `/scenarios/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/scenarios', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/scenarios/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/scenarios/${id}`, method: 'delete' })
  }
}

export const policyApi = {
  list(params) {
    return request({ url: '/policies', method: 'get', params })
  },
  detail(id) {
    return request({ url: `/policies/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/policies', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/policies/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/policies/${id}`, method: 'delete' })
  }
}

export const applicationApi = {
  list(params) {
    return request({ url: '/applications', method: 'get', params })
  },
  my(params) {
    return request({ url: '/applications/my', method: 'get', params })
  },
  detail(id) {
    return request({ url: `/applications/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/applications', method: 'post', data })
  },
  updateStatus(id, data) {
    return request({ url: `/applications/${id}/status`, method: 'put', data })
  },
  uploadMaterial(id, data) {
    return request({
      url: `/applications/${id}/materials`,
      method: 'post',
      data,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  sign(id, data) {
    return request({ url: `/applications/${id}/sign`, method: 'post', data })
  },
  pay(id, data) {
    return request({ url: `/applications/${id}/pay`, method: 'post', data })
  },
  getProgress(id) {
    return request({ url: `/applications/${id}/progress`, method: 'get' })
  }
}

export const evaluationApi = {
  list(params) {
    return request({ url: '/evaluations', method: 'get', params })
  },
  my(params) {
    return request({ url: '/evaluations/my', method: 'get', params })
  },
  create(data) {
    return request({ url: '/evaluations', method: 'post', data })
  },
  reply(id, data) {
    return request({ url: `/evaluations/${id}/reply`, method: 'post', data })
  },
  rectify(id, data) {
    return request({ url: `/evaluations/${id}/rectify`, method: 'post', data })
  }
}

export const chatApi = {
  createSession(data) {
    return request({ url: '/chat/sessions', method: 'post', data })
  },
  getSession(id) {
    return request({ url: `/chat/sessions/${id}`, method: 'get' })
  },
  sendMessage(sessionId, data) {
    return request({ url: `/chat/sessions/${sessionId}/messages`, method: 'post', data })
  },
  getMessages(sessionId, params) {
    return request({ url: `/chat/sessions/${sessionId}/messages`, method: 'get', params })
  },
  getFaqs(params) {
    return request({ url: '/chat/faqs', method: 'get', params })
  }
}

export const statisticsApi = {
  overview() {
    return request({ url: '/statistics/overview', method: 'get' })
  },
  trend(params) {
    return request({ url: '/statistics/trend', method: 'get', params })
  },
  byService(params) {
    return request({ url: '/statistics/by-service', method: 'get', params })
  },
  byRegion(params) {
    return request({ url: '/statistics/by-region', method: 'get', params })
  },
  evaluations(params) {
    return request({ url: '/statistics/evaluations', method: 'get', params })
  },
  efficiency(params) {
    return request({ url: '/statistics/efficiency', method: 'get', params })
  }
}

export const alertApi = {
  list(params) {
    return request({ url: '/alerts', method: 'get', params })
  },
  pendingCount() {
    return request({ url: '/alerts/pending-count', method: 'get' })
  },
  handle(id, data) {
    return request({ url: `/alerts/${id}/handle`, method: 'post', data })
  }
}

export const auditLogApi = {
  list(params) {
    return request({ url: '/audit-logs', method: 'get', params })
  },
  operations(params) {
    return request({ url: '/audit-logs/operations', method: 'get', params })
  }
}

export const userApi = {
  list(params) {
    return request({ url: '/users', method: 'get', params })
  },
  detail(id) {
    return request({ url: `/users/${id}`, method: 'get' })
  },
  create(data) {
    return request({ url: '/users', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/users/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/users/${id}`, method: 'delete' })
  },
  assignRoles(id, data) {
    return request({ url: `/users/${id}/roles`, method: 'put', data })
  }
}

export const roleApi = {
  list() {
    return request({ url: '/roles', method: 'get' })
  },
  create(data) {
    return request({ url: '/roles', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/roles/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/roles/${id}`, method: 'delete' })
  }
}

export const departmentApi = {
  list(params) {
    return request({ url: '/departments', method: 'get', params })
  },
  tree() {
    return request({ url: '/departments/tree', method: 'get' })
  },
  create(data) {
    return request({ url: '/departments', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/departments/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/departments/${id}`, method: 'delete' })
  }
}

export const regionApi = {
  list(params) {
    return request({ url: '/regions', method: 'get', params })
  },
  tree() {
    return request({ url: '/regions/tree', method: 'get' })
  },
  create(data) {
    return request({ url: '/regions', method: 'post', data })
  },
  update(id, data) {
    return request({ url: `/regions/${id}`, method: 'put', data })
  },
  remove(id) {
    return request({ url: `/regions/${id}`, method: 'delete' })
  }
}

export const certificateApi = {
  list(params) {
    return request({ url: '/certificates', method: 'get', params })
  },
  my(params) {
    return request({ url: '/certificates/my', method: 'get', params })
  },
  queryFromNational(certNo) {
    return request({ url: `/certificates/national/${certNo}`, method: 'get' })
  }
}

export const notificationApi = {
  list(params) {
    return request({ url: '/notifications', method: 'get', params })
  },
  my(params) {
    return request({ url: '/notifications/my', method: 'get', params })
  },
  unreadCount() {
    return request({ url: '/notifications/unread-count', method: 'get' })
  },
  markRead(id) {
    return request({ url: `/notifications/${id}/read`, method: 'post' })
  },
  markAllRead() {
    return request({ url: '/notifications/mark-all-read', method: 'post' })
  }
}

export const nationalPlatformApi = {
  syncItems() {
    return request({ url: '/national-platform/sync-items', method: 'post' })
  },
  authUser(data) {
    return request({ url: '/national-platform/auth-user', method: 'post', data })
  },
  getCert(certNo) {
    return request({ url: `/national-platform/cert/${certNo}`, method: 'get' })
  }
}
