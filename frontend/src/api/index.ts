import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  checkSession: () =>
    api.get('/auth/session')
}

export const filesApi = {
  getFiles: (parentId?: string) =>
    api.get('/files', { params: { parentId } }),
  
  getFile: (id: string) =>
    api.get(`/files/${id}`),
  
  deleteFile: (id: string) =>
    api.delete(`/files/${id}`),
  
  createFolder: (name: string, parentId?: string) =>
    api.post('/files/folder', { name, parentId }),
  
  initUpload: (fileName: string, fileSize: number, md5Hash?: string) =>
    api.post('/files/upload/init', { fileName, fileSize, md5Hash }),
  
  uploadChunk: (sessionId: string, chunkIndex: number, chunkData: Blob, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('sessionId', sessionId)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('chunk', chunkData)
    
    return api.post('/files/upload/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded / progressEvent.total)
        }
      }
    })
  },
  
  completeUpload: (sessionId: string, mimeType?: string, parentId?: string) =>
    api.post('/files/upload/complete', { sessionId, mimeType, parentId }),
  
  simpleUpload: (file: File, parentId?: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    if (parentId) formData.append('parentId', parentId)
    
    return api.post('/files/upload/simple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded / progressEvent.total)
        }
      }
    })
  },
  
  downloadFile: (id: string) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' })
}

export const versionsApi = {
  getFileVersions: (fileId: string) =>
    api.get(`/versions/file/${fileId}`),
  
  getVersion: (versionId: string) =>
    api.get(`/versions/${versionId}`),
  
  createVersion: (fileId: string, file: File, changeDescription?: string) => {
    const formData = new FormData()
    formData.append('fileId', fileId)
    formData.append('file', file)
    if (changeDescription) formData.append('changeDescription', changeDescription)
    
    return api.post('/versions/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  rollbackToVersion: (fileId: string, versionId: string) =>
    api.post('/versions/rollback', { fileId, versionId }),
  
  downloadVersion: (versionId: string) =>
    api.get(`/versions/download/${versionId}`, { responseType: 'blob' })
}

export const sharesApi = {
  getShareLinks: () =>
    api.get('/shares'),
  
  createShare: (options: {
    fileId: string,
    expiresAt?: string,
    password?: string,
    downloadLimit?: number,
    allowedIps?: string[],
    allowedDomains?: string[]
  }) =>
    api.post('/shares/create', options),
  
  getShareDetail: (shareLinkId: string) =>
    api.get(`/shares/${shareLinkId}`),
  
  revokeShare: (shareLinkId: string) =>
    api.post(`/shares/${shareLinkId}/revoke`),
  
  getPublicShare: (shareCode: string, password?: string) =>
    api.get(`/shares/code/${shareCode}`, { params: { password } }),
  
  downloadPublicShare: (shareCode: string, password?: string) =>
    api.get(`/shares/code/${shareCode}/download`, {
      params: { password },
      responseType: 'blob'
    })
}

export const adminApi = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  
  getUsers: () =>
    api.get('/admin/users'),
  
  getFiles: () =>
    api.get('/admin/files'),
  
  getDownloadRecords: () =>
    api.get('/admin/download-records'),
  
  getShareLinks: () =>
    api.get('/admin/share-links'),
  
  getAuditLogs: () =>
    api.get('/admin/audit-logs'),
  
  archiveFile: (fileId: string) =>
    api.post(`/admin/files/${fileId}/archive`),
  
  restoreFile: (fileId: string) =>
    api.post(`/admin/files/${fileId}/restore`),
  
  updateUserQuota: (userId: string, newQuotaBytes: number) =>
    api.post(`/admin/users/${userId}/update-quota`, { newQuotaBytes })
}

export default api
