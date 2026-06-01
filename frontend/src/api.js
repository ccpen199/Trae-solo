const BASE_URL = '/api'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }
  const res = await fetch(url, config)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `请求失败: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const fetchProjects = () => request('/projects').then(r => r.data || [])
export const createProject = (data) => request('/projects', { method: 'POST', body: data })
export const fetchProject = (id) => request(`/projects/${id}`).then(r => r.data)
export const updateProject = (id, data) => request(`/projects/${id}`, { method: 'PUT', body: data })
export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' })
export const archiveProject = (id) => request(`/projects/${id}/archive`, { method: 'PUT' })

export const fetchModules = () => request('/modules').then(r => r.data || [])
export const createModule = (data) => request('/modules', { method: 'POST', body: data })
export const updateModule = (id, data) => request(`/modules/${id}`, { method: 'PUT', body: data })
export const deleteModule = (id) => request(`/modules/${id}`, { method: 'DELETE' })

export const fetchPages = (projectId) => request(`/projects/${projectId}/pages`).then(r => r.data || [])
export const createPage = (projectId, data) => request(`/projects/${projectId}/pages`, { method: 'POST', body: data })
export const updatePage = (pageId, data) => request(`/pages/${pageId}`, { method: 'PUT', body: data })
export const deletePage = (pageId) => request(`/pages/${pageId}`, { method: 'DELETE' })

export const fetchVersions = (pageId) => request(`/pages/${pageId}/versions`).then(r => r.data || [])
export const createVersion = (pageId, data) => request(`/pages/${pageId}/versions`, { method: 'POST', body: data })
export const fetchVersion = (id) => request(`/versions/${id}`).then(r => r.data)
export const deleteVersion = (id) => request(`/versions/${id}`, { method: 'DELETE' })

export const fetchRequirements = (projectId) => request(`/projects/${projectId}/requirements`).then(r => r.data || [])
export const createRequirement = (projectId, data) => request(`/projects/${projectId}/requirements`, { method: 'POST', body: data })
export const updateRequirement = (id, data) => request(`/requirements/${id}`, { method: 'PUT', body: data })
export const deleteRequirement = (id) => request(`/requirements/${id}`, { method: 'DELETE' })
export const linkRequirement = (pageId, requirementId) => request(`/pages/${pageId}/requirements`, { method: 'POST', body: { requirement_id: requirementId } })
export const unlinkRequirement = (pageId, requirementId) => request(`/pages/${pageId}/requirements/${requirementId}`, { method: 'DELETE' })

export const fetchReviews = (projectId) => request(`/projects/${projectId}/reviews`).then(r => r.data || [])
export const fetchAllReviews = () => request('/reviews').then(r => r.data || [])
export const createReview = (projectId, data) => request(`/projects/${projectId}/reviews`, { method: 'POST', body: data })
export const fetchReview = (reviewId) => request(`/reviews/${reviewId}`).then(r => r.data)
export const updateReview = (reviewId, data) => request(`/reviews/${reviewId}`, { method: 'PUT', body: data })
export const addParticipant = (reviewId, data) => request(`/reviews/${reviewId}/participants`, { method: 'POST', body: data })
export const removeParticipant = (reviewId, participantId) => request(`/reviews/${reviewId}/participants/${participantId}`, { method: 'DELETE' })

export const fetchComments = (reviewId) => request(`/reviews/${reviewId}/comments`).then(r => r.data || [])
export const createComment = (reviewId, data) => request(`/reviews/${reviewId}/comments`, { method: 'POST', body: data })
export const updateComment = (commentId, data) => request(`/comments/${commentId}`, { method: 'PUT', body: data })
export const deleteComment = (commentId) => request(`/comments/${commentId}`, { method: 'DELETE' })

export const createResolution = (commentId, data) => request(`/comments/${commentId}/resolutions`, { method: 'POST', body: data })
export const fetchResolutions = (commentId) => request(`/comments/${commentId}/resolutions`).then(r => r.data || [])
export const confirmFix = (resolutionId, data) => request(`/resolutions/${resolutionId}/confirm`, { method: 'POST', body: data })
export const fetchConfirmations = (resolutionId) => request(`/resolutions/${resolutionId}/confirmations`).then(r => r.data || [])

export const fetchVersionDiff = (v1, v2) => request(`/versions/${v1}/diff/${v2}`).then(r => r.data)

export const fetchReportSummary = (projectId) => request(`/projects/${projectId}/reports/summary`).then(r => r.data)
