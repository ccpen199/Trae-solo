const API_BASE = (() => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) return envBase;
  const port = 58927;
  return `${window.location.protocol}//${window.location.hostname}:${port}/api`;
})();

async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw errorData;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw { error: '网络连接失败，请检查后端服务是否启动' };
    }
    throw error;
  }
}

export const dishesAPI = {
  getAll: () => request('/dishes'),
  get: (id) => request(`/dishes/${id}`),
  create: (data) => request('/dishes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/dishes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/dishes/${id}`, { method: 'DELETE' }),
};

export const ingredientsAPI = {
  getAll: () => request('/ingredients'),
  create: (data) => request('/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/ingredients/${id}`, { method: 'DELETE' }),
};

export const trialsAPI = {
  getByDish: (dishId) => request(`/trials/dish/${dishId}`),
  getCost: (trialId) => request(`/trials/${trialId}/cost`),
  getRecipeItems: (trialId) => request(`/trials/${trialId}/recipe-items`),
  create: (data) => request('/trials', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id, approvedBy) => request(`/trials/${id}/approve`, { method: 'POST', body: JSON.stringify({ approved_by: approvedBy }) }),
};

export const launchAPI = {
  getAll: () => request('/launch'),
  getByDish: (dishId) => request(`/launch/dish/${dishId}`),
  create: (data) => request('/launch', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/launch/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/launch/${id}`, { method: 'DELETE' }),
};

export const feedbackAPI = {
  getByDish: (dishId) => request(`/feedback/dish/${dishId}`),
  create: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
};

export const acceptanceAPI = {
  getByDish: (dishId) => request(`/acceptance/dish/${dishId}`),
  create: (data) => request('/acceptance', { method: 'POST', body: JSON.stringify(data) }),
};
