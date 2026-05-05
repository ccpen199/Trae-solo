import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ApiResponse, LoginResponse, RegisterResponse, User, News, Product, Cart } from '@/types';

class ApiService {
  private client: AxiosInstance;
  private tokenKey = 'jinzhongzi_token';

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          const errorMessage = data?.error || data?.message || '请求失败';

          switch (status) {
            case 401:
              this.removeToken();
              message.error('登录已过期，请重新登录');
              window.location.href = '/login';
              break;
            case 403:
              message.error('权限不足');
              break;
            case 404:
              message.error('资源不存在');
              break;
            case 500:
              message.error('服务器内部错误');
              break;
            default:
              message.error(errorMessage);
          }
        } else if (error.request) {
          message.error('网络连接失败，请检查网络');
        } else {
          message.error('请求配置错误');
        }

        return Promise.reject(error);
      }
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<ApiResponse<T>>(config);
    return response.data;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', { username, password });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async register(data: {
    username: string;
    email: string;
    phone?: string;
    password: string;
    nickname?: string;
    role: 'MEMBER' | 'DEALER';
    dealerCompany?: string;
    dealerLicense?: string;
    dealerRegion?: string;
  }): Promise<RegisterResponse> {
    const response = await this.client.post<RegisterResponse>('/auth/register', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.get<{ user: User }>('/auth/me');
    return response as { user: User };
  }

  async getNewsList(params?: {
    categoryCode?: string;
    categoryId?: string;
    type?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<News[]>> {
    return this.get<News[]>('/news', { params });
  }

  async getNewsDetail(id: string): Promise<{ data: News }> {
    const response = await this.get<News>(`/news/${id}`);
    return response as { data: News };
  }

  async getNewsCategories(): Promise<ApiResponse<NewsCategory[]>> {
    return this.get<NewsCategory[]>('/news/categories');
  }

  async addNewsComment(newsId: string, content: string, parentId?: string): Promise<unknown> {
    return this.post(`/news/${newsId}/comments`, { content, parentId });
  }

  async getProductList(params?: {
    categoryCode?: string;
    categoryId?: string;
    keyword?: string;
    isNew?: boolean;
    isHot?: boolean;
    isRecommend?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<Product[]>> {
    return this.get<Product[]>('/products', { params });
  }

  async getProductDetail(id: string): Promise<{ data: Product }> {
    const response = await this.get<Product>(`/products/${id}`);
    return response as { data: Product };
  }

  async getProductCategories(): Promise<ApiResponse<ProductCategory[]>> {
    return this.get<ProductCategory[]>('/products/categories');
  }

  async getCart(): Promise<{ data: Cart }> {
    const response = await this.get<Cart>('/products/cart');
    return response as { data: Cart };
  }

  async addToCart(productId: string, quantity: number = 1, specId?: string): Promise<unknown> {
    return this.post('/products/cart', { productId, quantity, specId });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<unknown> {
    return this.put(`/products/cart/${itemId}`, { quantity });
  }

  async removeFromCart(itemId: string): Promise<unknown> {
    return this.delete(`/products/cart/${itemId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
