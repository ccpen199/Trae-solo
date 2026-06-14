import request from './index';

export const getAccounts = () => {
  return request.get('/insurance/accounts');
};

export const getAccount = (id) => {
  return request.get(`/insurance/accounts/${id}`);
};

export const getPaymentHistory = (params) => {
  return request.get('/insurance/payment-history', { params });
};

export const createRegistration = (data) => {
  return request.post('/insurance/registrations', data);
};

export const getRegistrations = () => {
  return request.get('/insurance/registrations');
};

export const createBenefitCertification = (data) => {
  return request.post('/insurance/benefit-certifications', data);
};

export const getCertifications = () => {
  return request.get('/insurance/benefit-certifications');
};

export const createTransfer = (data) => {
  return request.post('/insurance/transfers', data);
};

export const getTransfers = () => {
  return request.get('/insurance/transfers');
};

export const createCertificate = (data) => {
  return request.post('/insurance/certificates', data);
};

export const getCertificates = () => {
  return request.get('/insurance/certificates');
};

export const getOverview = () => {
  return request.get('/insurance/overview');
};
