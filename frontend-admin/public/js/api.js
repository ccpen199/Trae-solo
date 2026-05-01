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
      if (error.status === 401) {
        this.setToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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

  async getContents(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.categoryId) params.append('categoryId', options.categoryId);
    if (options.keyword) params.append('keyword', options.keyword);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/contents?${params.toString()}`);
  }

  async getContent(id) {
    return this.get(`/contents/${id}`);
  }

  async createContent(data) {
    return this.post('/contents/import', data);
  }

  async updateContent(id, data) {
    return this.put(`/contents/${id}`, data);
  }

  async analyzeContent(id) {
    return this.post(`/contents/${id}/analyze`);
  }

  async setContentWeightTags(id, weightTagIds) {
    return this.put(`/contents/${id}/weight-tags`, { weightTagIds });
  }

  async publishContent(id) {
    return this.post(`/contents/${id}/publish`);
  }

  async getCategories() {
    return this.get('/contents/categories');
  }

  async getWeightTags() {
    return this.get('/contents/weight-tags');
  }

  async getOverview() {
    return this.get('/analytics/overview');
  }

  async getDAU(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.get(`/analytics/dau?${params.toString()}`);
  }

  async getRetention() {
    return this.get('/analytics/retention');
  }

  async getAuditLogs(options = {}) {
    const params = new URLSearchParams();
    if (options.eventType) params.append('eventType', options.eventType);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/analytics/audit-logs?${params.toString()}`);
  }

  async getAdCampaigns(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    
    return this.get(`/ads/campaigns?${params.toString()}`);
  }

  async getAdStats(options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    
    return this.get(`/ads/stats?${params.toString()}`);
  }

  async getRealtimeDashboard() {
    return this.get('/analytics/realtime-dashboard');
  }

  async getHealth() {
    return this.get('/health');
  }
}

const api = new ApiClient();
