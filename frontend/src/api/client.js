const API_BASE_URL = 'http://127.0.0.1:53408/api';

const request = async (url, options = {}) => {
  const userId = localStorage.getItem('userId') || '2';
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    ...options.headers,
  };

  console.log('Request:', options.method || 'GET', API_BASE_URL + url, 'userId:', userId);

  try {
    const response = await fetch(API_BASE_URL + url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    console.log('Response:', url, response.status);

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return { data };
  } catch (error) {
    console.error('Request error:', url, error.message);
    throw error;
  }
};

const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};

export default api;
