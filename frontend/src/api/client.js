import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  adminLogin: (data) => client.post('/auth/admin/login', data),
  profile: () => client.get('/auth/profile'),
  logout: () => client.post('/auth/logout'),
};

export const regionAPI = {
  getRegions: (params) => client.get('/regions', { params }),
  getRegion: (code) => client.get(`/regions/${code}`),
  getPOI: (code, params) => client.get(`/regions/${code}/poi`, { params }),
};

export const homeAPI = {
  getHome: () => client.get('/home'),
  getGuestHome: (regionCode) => client.get(`/home/guest/${regionCode}`),
};

export const jobAPI = {
  getJobs: (params) => client.get('/jobs', { params }),
  getJob: (id) => client.get(`/jobs/${id}`),
  getTemplates: () => client.get('/jobs/templates'),
  createJob: (data) => client.post('/jobs', data),
  applyJob: (id, data) => client.post(`/jobs/${id}/apply`, data),
  signJob: (id, data) => client.post(`/jobs/${id}/sign`, data),
};

export const propertyAPI = {
  getProperties: (params) => client.get('/properties', { params }),
  getProperty: (id) => client.get(`/properties/${id}`),
  verifyPropertyReg: (data) => client.post('/properties/verify/property-reg', data),
  verifyLandlord: (data) => client.post('/properties/verify/landlord', data),
  createProperty: (data) => client.post('/properties', data),
};

export const carAPI = {
  getCars: (params) => client.get('/cars', { params }),
  getCar: (id) => client.get(`/cars/${id}`),
  getAgencies: (params) => client.get('/cars/agencies', { params }),
  parseVIN: (data) => client.post('/cars/parse-vin', data),
  createCar: (data) => client.post('/cars', data),
  bookInspection: (id, data) => client.post(`/cars/${id}/book-inspection`, data),
};

export const newsAPI = {
  getNews: (params) => client.get('/news', { params }),
  getHotNews: (params) => client.get('/news/hot', { params }),
  getNewsDetail: (id) => client.get(`/news/${id}`),
  report: (data) => client.post('/news/report', data),
  getPendingNews: () => client.get('/news/admin/pending'),
  reviewNews: (id, data) => client.post(`/news/admin/${id}/review`, data),
  pushNews: (data) => client.post('/news/admin/push', data),
};

export const adminAPI = {
  getDashboard: () => client.get('/admin/dashboard'),
  getSensitiveWords: (params) => client.get('/admin/sensitive-words', { params }),
  addSensitiveWord: (data) => client.post('/admin/sensitive-words', data),
  deleteSensitiveWord: (id) => client.delete(`/admin/sensitive-words/${id}`),
  getValidationRecords: (params) => client.get('/admin/validation-records', { params }),
  getHeatmap: (params) => client.get('/admin/heatmap', { params }),
  getContentReview: (params) => client.get('/admin/content-review', { params }),
  auditContent: (type, id, data) => client.post(`/admin/content/${type}/${id}/audit`, data),
  checkSensitive: (data) => client.post('/admin/check-sensitive', data),
};

export default client;
