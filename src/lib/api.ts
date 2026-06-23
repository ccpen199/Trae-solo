import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'
import type {
  User,
  NamingInput,
  BaZiResult,
  NameProposal,
  CharacterInfo,
  CaseStudy,
  Master,
  ApiResponse,
  PaginatedResponse,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_KEY = 'yamingxuan_token'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const data = response.data
    if (data && data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      '网络错误，请稍后重试'
    return Promise.reject(new Error(message))
  }
)

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<ApiResponse<T>>(config)
  return response.data.data as T
}

export interface LoginParams {
  phone: string
  code?: string
  password?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface NamingGenerateParams {
  input: NamingInput
  count?: number
}

export const authApi = {
  login: (params: LoginParams) =>
    request<LoginResponse>({
      method: 'POST',
      url: '/auth/login',
      data: params,
    }),
  register: (params: { phone: string; code: string; nickname: string; password?: string }) =>
    request<LoginResponse>({
      method: 'POST',
      url: '/auth/register',
      data: params,
    }),
  sendCode: (phone: string) =>
    request<{ expiredAt: number }>({
      method: 'POST',
      url: '/auth/send-code',
      data: { phone },
    }),
  logout: () =>
    request<void>({
      method: 'POST',
      url: '/auth/logout',
    }),
  getCurrentUser: () =>
    request<User>({
      method: 'GET',
      url: '/auth/me',
    }),
}

export const namingApi = {
  calculateBaZi: (params: { birthDateTime: string; isLunarCalendar: boolean; birthPlace: NamingInput['birthPlace'] }) =>
    request<BaZiResult>({
      method: 'POST',
      url: '/naming/bazi',
      data: params,
    }),
  generateNames: (params: NamingGenerateParams) =>
    request<{ baZi: BaZiResult; proposals: NameProposal[] }>({
      method: 'POST',
      url: '/naming/generate',
      data: params,
    }),
  optimizeName: (params: { name: string; input: NamingInput }) =>
    request<NameProposal>({
      method: 'POST',
      url: '/naming/optimize',
      data: params,
    }),
  validateName: (name: string) =>
    request<{ valid: boolean; issues: string[]; score: number }>({
      method: 'POST',
      url: '/naming/validate',
      data: { name },
    }),
}

export const characterApi = {
  getByChar: (char: string) =>
    request<CharacterInfo>({
      method: 'GET',
      url: `/characters/${encodeURIComponent(char)}`,
    }),
  search: (params: { wuXing?: string; strokesMin?: number; strokesMax?: number; keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<CharacterInfo>>({
      method: 'GET',
      url: '/characters/search',
      params,
    }),
  getBatch: (chars: string[]) =>
    request<CharacterInfo[]>({
      method: 'POST',
      url: '/characters/batch',
      data: { chars },
    }),
}

export const nameApi = {
  analyze: (fullName: string, surname?: string) =>
    request<NameProposal>({
      method: 'POST',
      url: '/names/analyze',
      data: { fullName, surname },
    }),
  getDuplicateRate: (fullName: string, province?: string) =>
    request<{ total: number; province: number; ageDistribution: Record<string, number> }>({
      method: 'POST',
      url: '/names/duplicate-rate',
      data: { fullName, province },
    }),
  save: (proposal: NameProposal) =>
    request<{ id: string }>({
      method: 'POST',
      url: '/names/save',
      data: proposal,
    }),
  deleteSaved: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/names/${id}`,
    }),
  listSaved: (params?: { page?: number; pageSize?: number }) =>
    request<PaginatedResponse<NameProposal>>({
      method: 'GET',
      url: '/names/saved',
      params,
    }),
}

export const casesApi = {
  list: (params?: { page?: number; pageSize?: number; masterId?: string; keyword?: string }) =>
    request<PaginatedResponse<CaseStudy>>({
      method: 'GET',
      url: '/cases',
      params,
    }),
  get: (id: string) =>
    request<CaseStudy>({
      method: 'GET',
      url: `/cases/${id}`,
    }),
  like: (id: string) =>
    request<{ likes: number }>({
      method: 'POST',
      url: `/cases/${id}/like`,
    }),
  unlike: (id: string) =>
    request<{ likes: number }>({
      method: 'POST',
      url: `/cases/${id}/unlike`,
    }),
}

export const mastersApi = {
  list: (params?: { page?: number; pageSize?: number; specialties?: string }) =>
    request<PaginatedResponse<Master>>({
      method: 'GET',
      url: '/masters',
      params,
    }),
  get: (id: string) =>
    request<Master>({
      method: 'GET',
      url: `/masters/${id}`,
    }),
  getCases: (id: string, params?: { page?: number; pageSize?: number }) =>
    request<PaginatedResponse<CaseStudy>>({
      method: 'GET',
      url: `/masters/${id}/cases`,
      params,
    }),
  book: (id: string, params: { name: string; phone: string; message?: string }) =>
    request<{ bookingId: string }>({
      method: 'POST',
      url: `/masters/${id}/book`,
      data: params,
    }),
}

export const userApi = {
  updateProfile: (data: Partial<Pick<User, 'nickname' | 'avatar'>>) =>
    request<User>({
      method: 'PATCH',
      url: '/user/profile',
      data,
    }),
  changePhone: (params: { phone: string; code: string }) =>
    request<void>({
      method: 'POST',
      url: '/user/change-phone',
      data: params,
    }),
  getFavorites: (params?: { page?: number; pageSize?: number }) =>
    request<PaginatedResponse<NameProposal>>({
      method: 'GET',
      url: '/user/favorites',
      params,
    }),
  addFavorite: (nameId: string) =>
    request<void>({
      method: 'POST',
      url: '/user/favorites',
      data: { nameId },
    }),
  removeFavorite: (nameId: string) =>
    request<void>({
      method: 'DELETE',
      url: `/user/favorites/${nameId}`,
    }),
}

export const adminApi = {
  listUsers: (params?: { page?: number; pageSize?: number; keyword?: string }) =>
    request<PaginatedResponse<User>>({
      method: 'GET',
      url: '/admin/users',
      params,
    }),
  updateUserRole: (userId: string, role: User['role']) =>
    request<User>({
      method: 'PATCH',
      url: `/admin/users/${userId}/role`,
      data: { role },
    }),
  listMastersAdmin: (params?: { page?: number; pageSize?: number; status?: Master['status'] }) =>
    request<PaginatedResponse<Master>>({
      method: 'GET',
      url: '/admin/masters',
      params,
    }),
  approveMaster: (id: string) =>
    request<Master>({
      method: 'POST',
      url: `/admin/masters/${id}/approve`,
    }),
  rejectMaster: (id: string, reason: string) =>
    request<Master>({
      method: 'POST',
      url: `/admin/masters/${id}/reject`,
      data: { reason },
    }),
  disableMaster: (id: string) =>
    request<Master>({
      method: 'POST',
      url: `/admin/masters/${id}/disable`,
    }),
  listCasesAdmin: (params?: { page?: number; pageSize?: number }) =>
    request<PaginatedResponse<CaseStudy>>({
      method: 'GET',
      url: '/admin/cases',
      params,
    }),
  toggleCaseAuthorization: (id: string) =>
    request<CaseStudy>({
      method: 'POST',
      url: `/admin/cases/${id}/toggle-auth`,
    }),
  deleteCase: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/admin/cases/${id}`,
    }),
}

export const api = {
  instance: axiosInstance,
  auth: authApi,
  naming: namingApi,
  character: characterApi,
  name: nameApi,
  cases: casesApi,
  masters: mastersApi,
  user: userApi,
  admin: adminApi,
}

export default api
