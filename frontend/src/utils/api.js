const BASE_URL = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const login = (username, password) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
};

export const getDrivers = () => {
  return request('/drivers');
};

export const getTechnicians = () => {
  return request('/technicians');
};

export const getSuppliers = () => {
  return request('/suppliers');
};

export const getRescueRequests = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return request(`/rescue${queryString ? `?${queryString}` : ''}`);
};

export const getRescueDetail = (id) => {
  return request(`/rescue/${id}`);
};

export const createRescueRequest = (data) => {
  return request('/rescue', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const dispatchRescue = (id, technicianId) => {
  return request(`/rescue/${id}/dispatch`, {
    method: 'POST',
    body: JSON.stringify({ technicianId })
  });
};

export const recommendTechnicians = (rescueId) => {
  return request(`/rescue/${rescueId}/recommend-technicians`);
};

export const getMentorPairs = () => {
  return request('/mentor/pairs');
};

export const getMentorTasks = (pairId) => {
  const url = pairId ? `/mentor/tasks?pairId=${pairId}` : '/mentor/tasks';
  return request(url);
};

export const createMentorTask = (data) => {
  return request('/mentor/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const acceptMentorTask = (taskId) => {
  return request(`/mentor/tasks/${taskId}/accept`, {
    method: 'POST'
  });
};

export const guideMentorTask = (taskId, guidance) => {
  return request(`/mentor/tasks/${taskId}/guide`, {
    method: 'POST',
    body: JSON.stringify({ guidance })
  });
};

export const completeMentorTask = (taskId, rating) => {
  return request(`/mentor/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ rating })
  });
};

export const getCommunityPosts = () => {
  return request('/community/posts');
};

export const createCommunityPost = (data) => {
  return request('/community/posts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const getFaultCodes = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return request(`/fault-codes${queryString ? `?${queryString}` : ''}`);
};

export const getCourses = () => {
  return request('/courses');
};

export const getCourseDetail = (id) => {
  return request(`/courses/${id}`);
};

export const enrollCourse = (courseId) => {
  return request(`/courses/${courseId}/enroll`, {
    method: 'POST'
  });
};

export const getEnrollments = () => {
  return request('/courses/enrollments');
};

export const getCertificationExams = () => {
  return request('/courses/exams');
};

export const submitExamAttempt = (examId, answers) => {
  return request(`/courses/exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers })
  });
};

export const getCertifications = () => {
  return request('/courses/certifications');
};

export const getParts = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return request(`/parts${queryString ? `?${queryString}` : ''}`);
};

export const getVinMatch = (vin, partNumber) => {
  const queryString = new URLSearchParams({ vin, partNumber }).toString();
  return request(`/parts/vin-match?${queryString}`);
};

export const createPartsOrder = (data) => {
  return request('/parts/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const getPartsOrders = () => {
  return request('/parts/orders');
};

export const getPartsTraceability = (partId) => {
  return request(`/parts/${partId}/traceability`);
};

export const getAdminStats = () => {
  return request('/admin/stats');
};

export const getHeatmap = () => {
  return request('/admin/heatmap');
};

export const getCreditScores = () => {
  return request('/admin/credit-scores');
};

const api = {
  login,
  getDrivers,
  getTechnicians,
  getSuppliers,
  getRescueRequests,
  getRescueDetail,
  createRescueRequest,
  dispatchRescue,
  recommendTechnicians,
  getMentorPairs,
  getMentorTasks,
  createMentorTask,
  acceptMentorTask,
  guideMentorTask,
  completeMentorTask,
  getCommunityPosts,
  createCommunityPost,
  getFaultCodes,
  getCourses,
  getCourseDetail,
  enrollCourse,
  getEnrollments,
  getCertificationExams,
  submitExamAttempt,
  getCertifications,
  getParts,
  getVinMatch,
  createPartsOrder,
  getPartsOrders,
  getPartsTraceability,
  getAdminStats,
  getHeatmap,
  getCreditScores,
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' })
};

export default api;
