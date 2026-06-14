import request from '../utils/request';

export const login = (data) => request.post('/auth/login', data);
export const register = (data) => request.post('/auth/register', data);
export const getProfile = () => request.get('/auth/profile');
export const updateProfile = (data) => request.put('/auth/profile', data);

export const getCases = (params) => request.get('/cases', { params });
export const getCaseDetail = (id) => request.get(`/cases/${id}`);
export const likeCase = (id) => request.post(`/cases/${id}/like`);
export const getCaseFilters = () => request.get('/cases/filters/options');
export const migrateStyle = (data) => request.post('/cases/migrate/style', data);
export const createCase = (data) => request.post('/cases', data);

export const getQuotations = (params) => request.get('/quotations', { params });
export const getQuotationDetail = (id) => request.get(`/quotations/${id}`);
export const confirmQuotation = (id, data) => request.post(`/quotations/${id}/confirm`, data);
export const rejectQuotation = (id, data) => request.post(`/quotations/${id}/reject`, data);
export const calculateQuote = (data) => request.post('/quotations/calculate', data);

export const getProjects = (params) => request.get('/projects', { params });
export const getProjectDetail = (id) => request.get(`/projects/${id}`);
export const getProjectGantt = (id) => request.get(`/projects/${id}/gantt`);
export const createProject = (data) => request.post('/projects', data);

export const getDesignerSchedules = (params) => request.get('/erp/schedules', { params });
export const createSchedule = (data) => request.post('/erp/schedules', data);
export const updateSchedule = (id, data) => request.put(`/erp/schedules/${id}`, data);

export const getConstructionTasks = (params) => request.get('/erp/tasks', { params });
export const createTask = (data) => request.post('/erp/tasks', data);
export const updateTaskProgress = (id, data) => request.put(`/erp/tasks/${id}/progress`, data);

export const getMaterialPlans = (params) => request.get('/erp/materials', { params });
export const createMaterialPlan = (data) => request.post('/erp/materials', data);
export const updateMaterialStatus = (id, data) => request.put(`/erp/materials/${id}/status`, data);

export const getConstructionLogs = (params) => request.get('/manager/logs', { params });
export const createLog = (data) => request.post('/manager/logs', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getAcceptanceRecords = (params) => request.get('/manager/acceptance', { params });
export const createAcceptance = (data) => request.post('/manager/acceptance', data);

export const getFunds = (params) => request.get('/manager/funds', { params });
export const releaseFund = (id) => request.post(`/manager/funds/${id}/release`);

export const getDisputes = (params) => request.get('/manager/disputes', { params });
export const createDispute = (data) => request.post('/manager/disputes', data);

export const getCompanies = (params) => request.get('/admin/companies', { params });
export const auditCompany = (id, data) => request.post(`/admin/companies/${id}/audit`, data);

export const getProcessKnowledge = (params) => request.get('/admin/process-knowledge', { params });
export const getProcessCategories = () => request.get('/admin/process-knowledge/categories');
export const createProcessKnowledge = (data) => request.post('/admin/process-knowledge', data);

export const getMaterialPrices = (params) => request.get('/admin/material-prices', { params });
export const getMaterialPriceTrend = (params) => request.get('/admin/material-prices/trend', { params });
export const createMaterialPrice = (data) => request.post('/admin/material-prices', data);

export const getComplaints = (params) => request.get('/admin/complaints', { params });
export const handleComplaint = (id, data) => request.post(`/admin/complaints/${id}/handle`, data);

export const getDashboardStats = () => request.get('/admin/statistics/dashboard');
export const getAuditLogs = (params) => request.get('/admin/audit-logs', { params });
