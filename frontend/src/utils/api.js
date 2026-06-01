const API_BASE = '/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    if (error.name === 'SyntaxError') {
      throw new Error('服务器响应异常，请稍后重试');
    }
    if (error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查服务是否正常运行');
    }
    throw error;
  }
};

export const authAPI = {
  register: (username, email, password) => 
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (username, password) => 
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const cameraAPI = {
  detectScene: () => request('/camera/scene-detect'),
  getBeautyPreferences: () => request('/camera/beauty-preferences'),
  updateBeautyPreferences: (data) => 
    request('/camera/beauty-preferences', { method: 'PUT', body: JSON.stringify(data) }),
  getCaptureSuggestions: (scene, lighting) => 
    request('/camera/capture-suggestion', { method: 'POST', body: JSON.stringify({ scene, lighting }) }),
};

export const photoAPI = {
  upload: (formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}/photos/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then(res => res.json());
  },
  getMyPhotos: (page = 1, limit = 20) => 
    request(`/photos/my?page=${page}&limit=${limit}`),
  getPhoto: (id) => request(`/photos/${id}`),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),
  updateEditedPhoto: (id, data) => 
    request(`/photos/${id}/edit`, { method: 'PUT', body: JSON.stringify(data) }),
  createEditSession: (data) => 
    request('/photos/edit-session', { method: 'POST', body: JSON.stringify(data) }),
  updateEditSession: (id, data) => 
    request(`/photos/edit-session/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const communityAPI = {
  getPosts: (page = 1, limit = 20) => 
    request(`/community/posts?page=${page}&limit=${limit}`),
  getPost: (id) => request(`/community/posts/${id}`),
  createPost: (data) => 
    request('/community/posts', { method: 'POST', body: JSON.stringify(data) }),
  deletePost: (id) => request(`/community/posts/${id}`, { method: 'DELETE' }),
  likePost: (id) => request(`/community/posts/${id}/like`, { method: 'POST' }),
  addComment: (id, content) => 
    request(`/community/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  getComments: (id) => request(`/community/posts/${id}/comments`),
  followUser: (userId) => request(`/community/follow/${userId}`, { method: 'POST' }),
  getUserPosts: (userId) => request(`/community/user/${userId}/posts`),
};

export const filterAPI = {
  getFilters: (category) => 
    request(`/filters${category ? `?category=${category}` : ''}`),
  getCategories: () => request('/filters/categories'),
  applyFilter: (filterId, imageData) => 
    request(`/filters/${filterId}/apply`, { method: 'POST', body: JSON.stringify({ image_data: imageData }) }),
  aiEnhance: (imageData, type) => 
    request('/filters/ai-enhance', { method: 'POST', body: JSON.stringify({ image_data: imageData, enhance_type: type }) }),
  removeBackground: (imageData) => 
    request('/filters/remove-background', { method: 'POST', body: JSON.stringify({ image_data: imageData }) }),
  colorize: (imageData) => 
    request('/filters/colorize', { method: 'POST', body: JSON.stringify({ image_data: imageData }) }),
};

export const deviceAPI = {
  registerDevice: (deviceId, deviceName, deviceType) => 
    request('/devices/register', { method: 'POST', body: JSON.stringify({ device_id: deviceId, device_name: deviceName, device_type: deviceType }) }),
  getDevices: () => request('/devices'),
  sendAction: (deviceId, actionType, params) => 
    request(`/devices/${deviceId}/action`, { method: 'POST', body: JSON.stringify({ action_type: actionType, action_params: params }) }),
  getDeviceActions: (deviceId) => request(`/devices/${deviceId}/actions`),
  confirmAction: (actionId) => request(`/devices/actions/${actionId}/confirm`, { method: 'PUT' }),
  updateDeviceStatus: (deviceId, status) => 
    request(`/devices/${deviceId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteDevice: (deviceId) => request(`/devices/${deviceId}`, { method: 'DELETE' }),
};

export default {
  auth: authAPI,
  camera: cameraAPI,
  photo: photoAPI,
  community: communityAPI,
  filter: filterAPI,
  device: deviceAPI,
};