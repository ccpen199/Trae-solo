import request from './request';

export const getServices = (category) => {
  return request.get('/services', { params: { category } });
};

export const getServiceRecords = (params) => {
  return request.get('/services/records', { params });
};

export const getSocialCard = () => {
  return request.get('/services/social-card');
};

export const getMedicalRecords = (params) => {
  return request.get('/services/medical/records', { params });
};

export const getCertificates = () => {
  return request.get('/services/certificates');
};

export const pensionVerify = (data) => {
  return request.get('/services/pension/verify', { params: data });
};

export const unemploymentApply = (data) => {
  return request.post('/services/unemployment/apply', data);
};

export const laborReport = (data) => {
  return request.post('/services/labor/report', data);
};

export const socialTransfer = (data) => {
  return request.post('/services/social/transfer', data);
};

export const submitVerifyCode = (code, operation, data) => {
  return request.post(`/services/${operation}`, { ...data, verify_code: code });
};
