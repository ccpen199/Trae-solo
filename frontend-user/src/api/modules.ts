import api from './index';

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data)
};

export const productApi = {
  getCategories: () => api.get('/categories'),
  getProducts: (params: any) => api.get('/products', { params }),
  getHotProducts: () => api.get('/products/hot'),
  getProductDetail: (id: string) => api.get(`/products/${id}`),
  calculatePrice: (data: any) => api.post('/calculate-price', data),
  getPromotions: () => api.get('/promotions')
};

export const orderApi = {
  create: (data: any) => api.post('/orders', data),
  pay: (id: string) => api.post(`/orders/${id}/pay`),
  retry: (id: string) => api.post(`/orders/${id}/retry`),
  list: (params: any) => api.get('/orders', { params }),
  detail: (id: string) => api.get(`/orders/${id}`),
  getCards: (id: string) => api.get(`/orders/${id}/cards`),
  diagnostic: (id: string) => api.get(`/orders/${id}/diagnostic`)
};

export const commissionApi = {
  records: (params: any) => api.get('/commission/records', { params }),
  team: (params: any) => api.get('/commission/team', { params }),
  referrals: () => api.get('/commission/referrals'),
  shareCode: () => api.get('/commission/share-code'),
  withdraw: (data: any) => api.post('/commission/withdraw', data),
  recharge: (data: any) => api.post('/balance/recharge', data)
};
