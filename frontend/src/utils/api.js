const API_BASE = '/api';

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `请求失败: ${response.status}`);
  }
  
  return data;
};

const request = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  if (options.body && typeof options.body === 'object') {
    mergedOptions.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(`${API_BASE}${url}`, mergedOptions);
  return handleResponse(response);
};

export const authApi = {
  login: (username, password) => 
    request('/auth/login', {
      method: 'POST',
      body: { username, password }
    }),
  
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: userData
    }),
  
  logout: () =>
    request('/auth/logout', {
      method: 'POST'
    }),
  
  deleteAccount: () =>
    request('/auth/delete-account', {
      method: 'POST'
    }),
  
  getCurrentUser: () =>
    request('/auth/me', {
      method: 'GET'
    }),
  
  checkAuth: () =>
    request('/auth/check-auth', {
      method: 'GET'
    })
};

export const userApi = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.username) queryParams.append('username', filters.username);
    if (filters.role) queryParams.append('role', filters.role);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    return request(url, {
      method: 'GET'
    });
  },
  
  getById: (id) =>
    request(`/users/${id}`, {
      method: 'GET'
    }),
  
  update: (id, data) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: data
    }),
  
  delete: (id) =>
    request(`/users/${id}`, {
      method: 'DELETE'
    })
};

export default {
  authApi,
  userApi
};
