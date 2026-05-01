const API_BASE = '/api';
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-Id': SESSION_ID
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(method, endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        const error = new Error(result.message || '请求失败');
        error.status = response.status;
        error.data = result;
        throw error;
      }
      
      return result;
    } catch (error) {
      if (error.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        this.setToken(null);
        window.location.href = '/login';
      }
      throw error;
    }
  }

  get(endpoint) {
    return this.request('GET', endpoint);
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  async login(username, password) {
    const result = await this.post('/auth/login', { username, password });
    if (result.success && result.data.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async register(username, password, role = 'reader') {
    return this.post('/auth/register', { username, password, role });
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (e) {
      console.log('Logout request failed, but clearing token anyway');
    }
    this.setToken(null);
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async getFeed(options = {}) {
    const params = new URLSearchParams();
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/recommendations/feed?${params.toString()}`);
  }

  async getHotFeed(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/recommendations/hot?${params.toString()}`);
  }

  async getContent(id) {
    return this.get(`/contents/${id}`);
  }

  async markDelivered(recommendationIds, adDeliveryIds) {
    return this.post('/recommendations/delivered', {
      recommendationIds,
      adDeliveryIds
    });
  }

  async markViewed(recommendationId, contentId, viewDuration = 0) {
    return this.post('/recommendations/viewed', {
      recommendationId,
      contentId,
      viewDuration
    });
  }

  async markClicked(recommendationId, adDeliveryId) {
    return this.post('/recommendations/clicked', {
      recommendationId,
      adDeliveryId
    });
  }

  async toggleLike(contentId) {
    return this.post('/interactions/like', { contentId });
  }

  async toggleCollect(contentId) {
    return this.post('/interactions/collect', { contentId });
  }

  async submitComment(contentId, content) {
    return this.post('/interactions/comment', { contentId, content });
  }

  async getComments(contentId, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/interactions/comments/${contentId}?${params.toString()}`);
  }

  async submitNegativeFeedback(contentId, type, reason = null) {
    return this.post('/negative-feedbacks', {
      contentId,
      type,
      reason
    });
  }

  async getCategories() {
    return this.get('/contents/categories');
  }

  async getInteractionStats() {
    return this.get('/interactions/stats');
  }

  async getMyLikes(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/interactions/my/likes?${params.toString()}`);
  }

  async getMyCollects(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/interactions/my/collects?${params.toString()}`);
  }

  async getMyComments(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/interactions/my/comments?${params.toString()}`);
  }
}

const api = new ApiClient();

function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
