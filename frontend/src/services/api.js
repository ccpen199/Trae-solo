import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hiu_token');
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
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({ success: false, message: '网络连接失败，请检查网络' });
    }
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ success: false, message: '请求超时，请稍后重试' });
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('hiu_token');
      localStorage.removeItem('hiu_user');
      window.location.href = '/login';
      return Promise.reject({ success: false, message: '登录已过期，请重新登录' });
    }
    
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    
    return Promise.reject({ success: false, message: '请求失败，请稍后重试' });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
};

export const courseAPI = {
  getCategories: () => api.get('/courses/categories'),
  getCourses: (params) => api.get('/courses', { params }),
  getCourseDetail: (id) => api.get(`/courses/${id}`),
  getMyCourses: (params) => api.get('/courses/my', { params }),
  enrollCourse: (data) => api.post('/courses/enroll', data),
  createOrder: (data) => api.post('/courses/order', data),
  getDiscussions: (courseId, params) => api.get(`/courses/${courseId}/discussions`, { params }),
  createDiscussion: (data) => api.post('/courses/discussions', data),
  getDiscussionReplies: (discussionId) => api.get(`/courses/discussions/${discussionId}/replies`),
  createReply: (data) => api.post('/courses/discussions/replies', data),
  likeDiscussion: (data) => api.post('/courses/discussions/like', data)
};

export const communityAPI = {
  getCategories: () => api.get('/community/categories'),
  getPosts: (params) => api.get('/community/posts', { params }),
  getPostDetail: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts', data),
  createReply: (data) => api.post('/community/posts/replies', data),
  likePost: (data) => api.post('/community/posts/like', data),
  getMyPosts: (params) => api.get('/community/posts/my', { params })
};

export const assessmentAPI = {
  getAssessments: (params) => api.get('/assessments', { params }),
  getAssessmentDetail: (id) => api.get(`/assessments/${id}`),
  submitAssessment: (data) => api.post('/assessments/submit', data),
  getMyAssessments: (params) => api.get('/assessments/my', { params }),
  getWrongQuestions: (params) => api.get('/assessments/wrong-questions', { params })
};

export const userAPI = {
  updateProfile: (data) => api.put('/user/profile', data),
  getOrders: (params) => api.get('/user/orders', { params }),
  getMessages: (params) => api.get('/user/messages', { params }),
  markMessageRead: (messageId) => api.put(`/user/messages/${messageId}/read`),
  getStudyMaterials: (params) => api.get('/user/study-materials', { params })
};
