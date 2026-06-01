import request from '../utils/request';

export const authAPI = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getProfile: () => request.get('/auth/profile'),
};

export const productAPI = {
  getList: () => request.get('/products'),
  getDetail: (id) => request.get(`/products/${id}`),
};

export const creditAPI = {
  checkEligibility: (productId) => request.post('/credit/check-eligibility', { productId }),
  create: (productId) => request.post('/credit', { productId }),
  saveIdCard: (id, data) => request.put(`/credit/${id}/id-card`, data),
  savePersonalInfo: (id, data) => request.put(`/credit/${id}/personal-info`, data),
  saveContactInfo: (id, data) => request.put(`/credit/${id}/contact-info`, data),
  getList: () => request.get('/credit'),
  getDetail: (id) => request.get(`/credit/${id}`),
};

export const loanAPI = {
  create: (data) => request.post('/loan', data),
  getList: () => request.get('/loan'),
  getByCredit: (creditId) => request.get(`/loan/credit/${creditId}`),
  getDetail: (id) => request.get(`/loan/${id}`),
  getRepayments: (id) => request.get(`/loan/${id}/repayments`),
};
