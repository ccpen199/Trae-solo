import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
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

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const bookApi = {
  getBooks: (params) => api.get('/books', { params }),
  getBookById: (id) => api.get(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export const readerApi = {
  getReaders: (params) => api.get('/readers', { params }),
  getReaderById: (id) => api.get(`/readers/${id}`),
  getReaderBorrowRecords: (id, params) => api.get(`/readers/${id}/borrow-records`, { params }),
  createReader: (data) => api.post('/readers', data),
  updateReader: (id, data) => api.put(`/readers/${id}`, data),
  deleteReader: (id) => api.delete(`/readers/${id}`),
};

export const adminApi = {
  getAdmins: (params) => api.get('/admins', { params }),
  getAdminById: (id) => api.get(`/admins/${id}`),
  createAdmin: (data) => api.post('/admins', data),
  updateAdmin: (id, data) => api.put(`/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/admins/${id}`),
};

export const borrowApi = {
  getMyRecords: (params) => api.get('/borrow/my-records', { params }),
  getAllRecords: (params) => api.get('/borrow/all-records', { params }),
  borrowBook: (data) => api.post('/borrow/borrow', data),
  returnBook: (recordId) => api.post('/borrow/return', { recordId }),
  renewBook: (recordId) => api.post('/borrow/renew', { recordId }),
  getStatistics: () => api.get('/borrow/statistics'),
};

export default api;
