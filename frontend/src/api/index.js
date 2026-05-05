import request from '../utils/request';

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  getProfile: () => request.get('/auth/profile'),
  changePassword: (data) => request.put('/auth/password', data)
};

export const productsApi = {
  getSeries: () => request.get('/products/series'),
  createSeries: (data) => request.post('/products/series', data),
  updateSeries: (id, data) => request.put(`/products/series/${id}`, data),
  deleteSeries: (id) => request.delete(`/products/series/${id}`),

  getCategories: (params) => request.get('/products/categories', { params }),
  createCategory: (data) => request.post('/products/categories', data),
  updateCategory: (id, data) => request.put(`/products/categories/${id}`, data),
  deleteCategory: (id) => request.delete(`/products/categories/${id}`),

  getList: (params) => request.get('/products', { params }),
  getAdminList: (params) => request.get('/products/admin/list', { params }),
  getDetail: (id) => request.get(`/products/${id}`),
  create: (data) => request.post('/products', data),
  update: (id, data) => request.put(`/products/${id}`, data),
  delete: (id) => request.delete(`/products/${id}`)
};

export const newsApi = {
  getCategories: () => request.get('/news/categories'),
  createCategory: (data) => request.post('/news/categories', data),
  updateCategory: (id, data) => request.put(`/news/categories/${id}`, data),
  deleteCategory: (id) => request.delete(`/news/categories/${id}`),

  getList: (params) => request.get('/news', { params }),
  getAdminList: (params) => request.get('/news/admin/list', { params }),
  getDetail: (id) => request.get(`/news/${id}`),
  create: (data) => request.post('/news', data),
  update: (id, data) => request.put(`/news/${id}`, data),
  delete: (id) => request.delete(`/news/${id}`)
};

export const messagesApi = {
  getCategories: () => request.get('/messages/categories'),
  create: (data) => request.post('/messages', data),
  getList: (params) => request.get('/messages/list', { params }),
  getDetail: (id) => request.get(`/messages/${id}`),
  reply: (id, data) => request.put(`/messages/${id}/reply`, data),
  updateStatus: (id, data) => request.put(`/messages/${id}/status`, data),
  delete: (id) => request.delete(`/messages/${id}`)
};

export const jobsApi = {
  getList: (params) => request.get('/jobs', { params }),
  getAdminList: (params) => request.get('/jobs/admin/list', { params }),
  getDetail: (id) => request.get(`/jobs/${id}`),
  create: (data) => request.post('/jobs', data),
  update: (id, data) => request.put(`/jobs/${id}`, data),
  delete: (id) => request.delete(`/jobs/${id}`),
  submitResume: (data) => request.post('/jobs/resume', data),
  getResumes: (params) => request.get('/jobs/resumes/list', { params }),
  getResumeDetail: (id) => request.get(`/jobs/resumes/${id}`),
  updateResumeStatus: (id, data) => request.put(`/jobs/resumes/${id}/status`, data),
  deleteResume: (id) => request.delete(`/jobs/resumes/${id}`)
};

export const membersApi = {
  register: (data) => request.post('/members/register', data),
  login: (data) => request.post('/members/login', data),
  getTypes: () => request.get('/members/types'),
  getList: (params) => request.get('/members/list', { params }),
  getDetail: (id) => request.get(`/members/${id}`),
  audit: (id, data) => request.put(`/members/${id}/audit`, data),
  updateStatus: (id, data) => request.put(`/members/${id}/status`, data)
};

export const commonApi = {
  getCategories: (params) => request.get('/common/categories', { params }),
  getCompanyInfo: () => request.get('/common/company-info'),
  updateCompanyInfo: (data) => request.put('/common/company-info', data),
  getLinks: (params) => request.get('/common/links', { params }),
  getSettings: () => request.get('/common/settings'),
  getDownloadCategories: () => request.get('/common/download-categories'),
  getDownloads: (params) => request.get('/common/downloads', { params }),
  getMarketingCategories: () => request.get('/common/marketing-categories'),
  getMarketingContent: (params) => request.get('/common/marketing-content', { params }),
  getOrgStructure: () => request.get('/common/org-structure'),
  getCertifications: () => request.get('/common/certifications'),
  healthCheck: () => request.get('/health')
};
