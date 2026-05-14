import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true
});

const adminApiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error.response?.data || { error: '请求失败' });
  }
);

adminApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
    }
    return Promise.reject(error.response?.data || { error: '请求失败' });
  }
);

export default api;
export { adminApiClient };

export const authApi = {
  sendCode: (data) => api.post('/auth/send-code', data),
  phoneLogin: (data) => api.post('/auth/phone-login', data),
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  thirdPartyLogin: (data) => api.post('/auth/third-party-login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  adminLogin: (data) => api.post('/auth/admin/login', data)
};

export const productApi = {
  getList: (params) => api.get('/products', { params }),
  search: (params) => api.get('/products/search', { params }),
  getNew: (params) => api.get('/products/new', { params }),
  getHot: (params) => api.get('/products/hot', { params }),
  getRecommend: (params) => api.get('/products/recommend', { params }),
  getGuessLike: (params) => api.get('/products/guess-like', { params }),
  getBrandDirect: (params) => api.get('/products/brand-direct', { params }),
  getDetail: (id) => api.get(`/products/${id}`),
  getSupplier: (supplier, params) => api.get(`/products/supplier/${supplier}`, { params })
};

export const cartApi = {
  getList: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (data) => api.put('/cart/update', data),
  selectAll: (data) => api.post('/cart/select-all', data),
  remove: (cartId) => api.delete(`/cart/${cartId}`),
  removeBatch: (data) => api.delete('/cart', { data }),
  merge: (data) => api.post('/cart/merge', data)
};

export const orderApi = {
  getList: (params) => api.get('/orders', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  checkout: (data) => api.post('/orders/checkout', data),
  create: (data) => api.post('/orders/create', data),
  pay: (id) => api.post(`/orders/${id}/pay`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  confirm: (id) => api.post(`/orders/${id}/confirm`)
};

export const categoryApi = {
  getList: () => api.get('/categories'),
  getProducts: (categoryId, params) => api.get(`/categories/${categoryId}/products`, { params })
};

export const contentApi = {
  getList: (params) => api.get('/content', { params }),
  getCategories: () => api.get('/content/categories'),
  getDetail: (id) => api.get(`/content/${id}`),
  like: (id) => api.post(`/content/${id}/like`)
};

export const channelApi = {
  getList: () => api.get('/channels'),
  getFeatured: (code, params) => api.get(`/channels/${code}/featured`, { params }),
  getRecommendModules: () => api.get('/channels/recommend/modules')
};

export const crowdfundingApi = {
  getList: (params) => api.get('/crowdfunding', { params }),
  getDetail: (id) => api.get(`/crowdfunding/${id}`),
  support: (id, data) => api.post(`/crowdfunding/${id}/support`, data)
};

export const promotionApi = {
  getCoupons: () => api.get('/promotions/coupons'),
  claimCoupon: (id) => api.post(`/promotions/coupons/${id}/claim`),
  getMyCoupons: (params) => api.get('/promotions/my-coupons', { params }),
  getFlashSale: () => api.get('/promotions/flash-sale')
};

export const adminApi = {
  login: (data) => api.post('/auth/admin/login', data),
  getStats: () => adminApiClient.get('/admin/stats'),
  getProducts: (params) => adminApiClient.get('/admin/products', { params }),
  createProduct: (data) => adminApiClient.post('/admin/products', data),
  updateProduct: (id, data) => adminApiClient.put(`/admin/products/${id}`, data),
  updateProductStatus: (id, data) => adminApiClient.put(`/admin/products/${id}/status`, data),
  getOrders: (params) => adminApiClient.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => adminApiClient.put(`/admin/orders/${id}/status`, data),
  shipOrder: (id) => adminApiClient.post(`/admin/orders/${id}/ship`),
  getChannels: () => adminApiClient.get('/admin/channels'),
  createChannel: (data) => adminApiClient.post('/admin/channels', data),
  updateChannel: (id, data) => adminApiClient.put(`/admin/channels/${id}`, data),
  getContents: (params) => adminApiClient.get('/admin/contents', { params }),
  createContent: (data) => adminApiClient.post('/admin/contents', data),
  updateContent: (id, data) => adminApiClient.put(`/admin/contents/${id}`, data),
  deleteContent: (id) => adminApiClient.delete(`/admin/contents/${id}`),
  linkContentProducts: (contentId, data) => adminApiClient.post(`/admin/contents/${contentId}/products`, data),
  getCoupons: () => adminApiClient.get('/admin/coupons'),
  createCoupon: (data) => adminApiClient.post('/admin/coupons', data),
  deleteCoupon: (id) => adminApiClient.delete(`/admin/coupons/${id}`),
  getCrowdfunding: () => adminApiClient.get('/admin/crowdfunding'),
  updateCrowdfunding: (id, data) => adminApiClient.put(`/admin/crowdfunding/${id}`, data),
  createCrowdfunding: (data) => adminApiClient.post('/admin/crowdfunding', data),
  createCrowdfundingGear: (projectId, data) => adminApiClient.post(`/admin/crowdfunding/${projectId}/gears`, data),
  getUsers: (params) => adminApiClient.get('/admin/users', { params }),
  updateUser: (id, data) => adminApiClient.put(`/admin/users/${id}`, data),
  updateUserVip: (userId, data) => adminApiClient.put(`/admin/users/${userId}/vip`, data)
};
