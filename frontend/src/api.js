import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);
export const getSupplierFactories = (supplierId) => api.get(`/suppliers/${supplierId}/factories`);

export const getAuditors = () => api.get('/auditors');

export const getAuditPlans = () => api.get('/audit-plans');
export const getAuditPlan = (id) => api.get(`/audit-plans/${id}`);
export const createAuditPlan = (data) => api.post('/audit-plans', data);
export const updateAuditPlan = (id, data) => api.put(`/audit-plans/${id}`, data);
export const deleteAuditPlan = (id) => api.delete(`/audit-plans/${id}`);
export const checkConflict = (data) => api.post('/audit-plans/check-conflict', data);

export const getChecklistCategories = () => api.get('/checklists/categories');
export const getAuditChecklist = (auditPlanId) => api.get(`/checklists/audit/${auditPlanId}/with-structure`);
export const saveChecklistItem = (auditPlanId, data) => api.post(`/checklists/audit/${auditPlanId}`, data);
export const saveChecklistBatch = (auditPlanId, data) => api.post(`/checklists/audit/${auditPlanId}/batch`, data);

export const getIssues = (auditPlanId) => api.get(`/issues/audit/${auditPlanId}`);
export const createIssue = (data) => api.post('/issues', data);
export const updateIssue = (id, data) => api.put(`/issues/${id}`, data);
export const deleteIssue = (id) => api.delete(`/issues/${id}`);
export const checkAuditPass = (auditPlanId) => api.get(`/issues/check-audit-pass/${auditPlanId}`);

export const getReports = () => api.get('/reports');
export const generateReport = (auditPlanId) => api.get(`/reports/generate/${auditPlanId}`);
export const exportReportPDF = (auditPlanId) => {
  window.open(`${API_BASE_URL}/reports/export-pdf/${auditPlanId}`, '_blank');
};

export default api;
