import request from './index';

export const getPolicies = (params) => {
  return request.get('/policies', { params });
};

export const getPolicy = (id) => {
  return request.get(`/policies/${id}`);
};

export const getPolicy3DSearch = (params) => {
  return request.get('/policies/3d-search', { params });
};

export const getHotPolicies = (params) => {
  return request.get('/policies/hot', { params });
};

export const getPolicyCategories = () => {
  return request.get('/policy-categories');
};

export const getFaqs = (params) => {
  return request.get('/faq', { params });
};

export const submitFaqFeedback = (id, data) => {
  return request.post(`/faq/${id}/feedback`, data);
};

export const getFaqAutoAttribution = (params) => {
  return request.get('/faq/auto-attribution', { params });
};

export const submitConsultation = (data) => {
  return request.post('/consultation', data);
};

export const getConsultationHistory = () => {
  return request.get('/consultation/history');
};

export const submitConsultationSatisfaction = (id, data) => {
  return request.post(`/consultation/${id}/satisfaction`, data);
};

export const getKnowledgeGraph = (params) => {
  return request.get('/knowledge-graph', { params });
};

export const getKnowledgeGraphDetail = (id) => {
  return request.get(`/knowledge-graph/${id}`);
};
