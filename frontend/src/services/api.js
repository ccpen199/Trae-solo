const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const authAPI = {
  register: (username, password) => 
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  login: (username, password) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
};

export const plantingAPI = {
  start: (duration, treeType, tagId) =>
    request('/planting/start', {
      method: 'POST',
      body: JSON.stringify({ duration, treeType, tagId })
    }),
  complete: (plantingId, actualDuration) =>
    request('/planting/complete', {
      method: 'POST',
      body: JSON.stringify({ plantingId, actualDuration })
    }),
  wither: (plantingId) =>
    request('/planting/wither', {
      method: 'POST',
      body: JSON.stringify({ plantingId })
    }),
  getRecords: (page, limit) =>
    request(`/planting/records?page=${page || 1}&limit=${limit || 20}`),
  getForest: () => request('/planting/forest')
};

export const userAPI = {
  getProfile: () => request('/user/profile'),
  updateProfile: (data) =>
    request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getTags: () => request('/user/tags'),
  createTag: (name, color) =>
    request('/user/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color })
    }),
  getAchievements: () => request('/user/achievements'),
  getFriends: () => request('/user/friends'),
  addFriend: (username) =>
    request('/user/friends/add', {
      method: 'POST',
      body: JSON.stringify({ username })
    }),
  getMessages: () => request('/user/messages'),
  markMessageRead: (id) =>
    request(`/user/messages/${id}/read`, { method: 'PUT' })
};

export const shopAPI = {
  getTrees: () => request('/shop/trees'),
  buyTree: (treeId) =>
    request('/shop/trees/buy', {
      method: 'POST',
      body: JSON.stringify({ treeId })
    }),
  getMusic: () => request('/shop/music')
};
