import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Union,
  UnionMember,
  LoginResult,
  PaginatedResponse,
  RankItem,
} from '@/types';

const API_BASE_URL = '/api';

class ApiService {
  private axios: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.token = localStorage.getItem('auth_token');
  }

  private setupInterceptors() {
    this.axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // 用户相关
  async register(username: string, password: string, nickname?: string) {
    const response = await this.axios.post('/users/register', {
      username,
      password,
      nickname,
    });
    return response.data;
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const response = await this.axios.post('/users/login', {
      username,
      password,
    });
    return response.data.data;
  }

  async logoutApi() {
    const response = await this.axios.post('/users/logout');
    this.logout();
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.axios.get('/users/profile');
    return response.data.data;
  }

  async updateProfile(data: { nickname?: string; avatar?: string; email?: string }) {
    const response = await this.axios.put('/users/profile', data);
    return response.data;
  }

  // 联盟相关
  async getUnions(options?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    isRecommend?: boolean;
    sortBy?: 'reputation' | 'memberCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Union>> {
    const response = await this.axios.get('/unions', { params: options });
    return response.data.data;
  }

  async getRecommendedUnions(limit?: number): Promise<Union[]> {
    const response = await this.axios.get('/unions/recommended', { params: { limit } });
    return response.data.data;
  }

  async getUnionRanking(
    type: 'reputation' | 'member' = 'reputation',
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<RankItem>> {
    const response = await this.axios.get('/unions/ranking', {
      params: { type, page, pageSize },
    });
    return response.data.data;
  }

  async getMyUnions(): Promise<Union[]> {
    const response = await this.axios.get('/unions/my');
    return response.data.data;
  }

  async createUnion(data: {
    name: string;
    description?: string;
    avatar?: string;
  }): Promise<Union> {
    const response = await this.axios.post('/unions', data);
    return response.data.data;
  }

  async getUnionDetail(unionId: string): Promise<Union> {
    const response = await this.axios.get(`/unions/${unionId}`);
    return response.data.data;
  }

  async updateUnion(
    unionId: string,
    data: { name?: string; description?: string; avatar?: string }
  ) {
    const response = await this.axios.put(`/unions/${unionId}`, data);
    return response.data;
  }

  async joinUnion(unionId: string) {
    const response = await this.axios.post(`/unions/${unionId}/join`);
    return response.data;
  }

  async leaveUnion(unionId: string) {
    const response = await this.axios.post(`/unions/${unionId}/leave`);
    return response.data;
  }

  // 成员相关
  async getUnionMembers(
    unionId: string,
    options?: {
      page?: number;
      pageSize?: number;
      role?: number;
      sortBy?: 'contribution' | 'joinAt' | 'lastActiveAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<UnionMember>> {
    const response = await this.axios.get(`/unions/${unionId}/members`, {
      params: options,
    });
    return response.data.data;
  }

  async getContributionRanking(
    unionId: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<UnionMember & { rank: number }>> {
    const response = await this.axios.get(`/unions/${unionId}/ranking/contribution`, {
      params: { page, pageSize },
    });
    return response.data.data;
  }

  async kickMember(unionId: string, userId: string) {
    const response = await this.axios.post(`/unions/${unionId}/members/${userId}/kick`);
    return response.data;
  }

  async transferLeader(unionId: string, newLeaderId: string) {
    const response = await this.axios.post(`/unions/${unionId}/transfer-leader`, {
      newLeaderId,
    });
    return response.data;
  }

  async setViceLeader(unionId: string, userId: string, isVice: boolean) {
    const response = await this.axios.post(
      `/unions/${unionId}/members/${userId}/set-vice`,
      { isVice }
    );
    return response.data;
  }

  // 记录用户行为
  async recordAction(type: 'post' | 'reply' | 'login') {
    const response = await this.axios.post('/unions/action', { type });
    return response.data;
  }
}

export const api = new ApiService();
export default api;
