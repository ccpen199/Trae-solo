const API_BASE = '/api';

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
      'Content-Type': 'application/json'
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

  async register(username, password, role = 'advertiser') {
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

  async getAdvertiserProfile() {
    return this.get('/ads/advertiser/profile');
  }

  async updateAdvertiserProfile(data) {
    return this.put('/ads/advertiser/profile', data);
  }

  async getCampaigns(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/ads/campaigns?${params.toString()}`);
  }

  async getCampaign(id) {
    return this.get(`/ads/campaigns/${id}`);
  }

  async createCampaign(data) {
    return this.post('/ads/campaigns', data);
  }

  async updateCampaign(id, data) {
    return this.put(`/ads/campaigns/${id}`, data);
  }

  async getMaterials(options = {}) {
    const params = new URLSearchParams();
    if (options.campaignId) params.append('campaignId', options.campaignId);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/ads/materials?${params.toString()}`);
  }

  async createMaterial(data) {
    return this.post('/ads/materials', data);
  }

  async getDeliveries(options = {}) {
    const params = new URLSearchParams();
    if (options.campaignId) params.append('campaignId', options.campaignId);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/ads/deliveries?${params.toString()}`);
  }

  async getStats(options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.campaignId) params.append('campaignId', options.campaignId);
    
    return this.get(`/ads/stats?${params.toString()}`);
  }

  async getReconciliations(options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.status) params.append('status', options.status);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/ads/reconciliations?${params.toString()}`);
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
