import axios from 'axios';
import type { ApiResponse, User, LoginParams, RegisterParams, LoginResult, Tour, TourGroup, Order, PaginatedResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (params: LoginParams): Promise<LoginResult> => {
    const response = await api.post<ApiResponse<LoginResult>>('/auth/login', params);
    if (!response.data.success) {
      throw new Error(response.data.message || '登录失败');
    }
    return response.data.data!;
  },

  register: async (params: RegisterParams): Promise<LoginResult> => {
    const response = await api.post<ApiResponse<LoginResult>>('/auth/register', params);
    if (!response.data.success) {
      throw new Error(response.data.message || '注册失败');
    }
    return response.data.data!;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    if (!response.data.success) {
      throw new Error(response.data.message || '获取用户信息失败');
    }
    return response.data.data!;
  },

  updateUser: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/auth/me', data);
    if (!response.data.success) {
      throw new Error(response.data.message || '更新用户信息失败');
    }
    return response.data.data!;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    const response = await api.post<ApiResponse>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '修改密码失败');
    }
  },
};

export const tourApi = {
  getPublicList: async (params?: {
    page?: number;
    pageSize?: number;
    destination?: string;
    category?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Tour>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Tour>>>('/tours/public', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取线路列表失败');
    }
    return response.data.data!;
  },

  getPublicTour: async (id: string): Promise<Tour> => {
    const response = await api.get<ApiResponse<Tour>>(`/tours/public/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取线路详情失败');
    }
    return response.data.data!;
  },

  getList: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    destination?: string;
    category?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Tour>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Tour>>>('/tours', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取线路列表失败');
    }
    return response.data.data!;
  },

  get: async (id: string, includeGroups?: boolean): Promise<Tour> => {
    const response = await api.get<ApiResponse<Tour>>(`/tours/${id}`, {
      params: { includeGroups },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取线路详情失败');
    }
    return response.data.data!;
  },

  create: async (data: Partial<Tour>): Promise<Tour> => {
    const response = await api.post<ApiResponse<Tour>>('/tours', data);
    if (!response.data.success) {
      throw new Error(response.data.message || '创建线路失败');
    }
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Tour>): Promise<Tour> => {
    const response = await api.put<ApiResponse<Tour>>(`/tours/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || '更新线路失败');
    }
    return response.data.data!;
  },

  publish: async (id: string): Promise<Tour> => {
    const response = await api.post<ApiResponse<Tour>>(`/tours/${id}/publish`);
    if (!response.data.success) {
      throw new Error(response.data.message || '发布线路失败');
    }
    return response.data.data!;
  },

  archive: async (id: string): Promise<Tour> => {
    const response = await api.post<ApiResponse<Tour>>(`/tours/${id}/archive`);
    if (!response.data.success) {
      throw new Error(response.data.message || '归档线路失败');
    }
    return response.data.data!;
  },

  getStats: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/tours/${id}/stats`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取线路统计失败');
    }
    return response.data.data!;
  },
};

export const groupApi = {
  getList: async (params?: {
    page?: number;
    pageSize?: number;
    tourId?: string;
    status?: string;
    startDateFrom?: string;
    startDateTo?: string;
  }): Promise<PaginatedResponse<TourGroup>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<TourGroup>>>('/groups', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取团期列表失败');
    }
    return response.data.data!;
  },

  getPublicList: async (params?: {
    tourId?: string;
    status?: string;
  }): Promise<PaginatedResponse<TourGroup>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<TourGroup>>>('/groups/public', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取团期列表失败');
    }
    return response.data.data!;
  },

  get: async (id: string): Promise<TourGroup> => {
    const response = await api.get<ApiResponse<TourGroup>>(`/groups/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取团期详情失败');
    }
    return response.data.data!;
  },

  create: async (data: any): Promise<TourGroup> => {
    const response = await api.post<ApiResponse<TourGroup>>('/groups', data);
    if (!response.data.success) {
      throw new Error(response.data.message || '创建团期失败');
    }
    return response.data.data!;
  },

  publish: async (id: string): Promise<TourGroup> => {
    const response = await api.post<ApiResponse<TourGroup>>(`/groups/${id}/publish`);
    if (!response.data.success) {
      throw new Error(response.data.message || '发布团期失败');
    }
    return response.data.data!;
  },

  getInventory: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/groups/${id}/inventory`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取库存信息失败');
    }
    return response.data.data!;
  },

  assignGuide: async (id: string, guideId: string): Promise<TourGroup> => {
    const response = await api.put<ApiResponse<TourGroup>>(`/groups/${id}/assign-guide`, {
      guideId,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '分配导游失败');
    }
    return response.data.data!;
  },
};

export const orderApi = {
  getList: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    groupId?: string;
  }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取订单列表失败');
    }
    return response.data.data!;
  },

  get: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取订单详情失败');
    }
    return response.data.data!;
  },

  create: async (data: any): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    if (!response.data.success) {
      throw new Error(response.data.message || '创建订单失败');
    }
    return response.data.data!;
  },

  payment: async (id: string, amount: number, method: string): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/payment`, {
      amount,
      method,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '支付失败');
    }
    return response.data.data!;
  },

  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`, {
      reason,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '取消订单失败');
    }
    return response.data.data!;
  },

  confirm: async (id: string): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/confirm`);
    if (!response.data.success) {
      throw new Error(response.data.message || '确认订单失败');
    }
    return response.data.data!;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '更新订单状态失败');
    }
    return response.data.data!;
  },
};

export const guideApi = {
  getTasks: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/guide/tasks', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取任务列表失败');
    }
    return response.data.data!;
  },

  getTask: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/guide/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取任务详情失败');
    }
    return response.data.data!;
  },

  startTour: async (id: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/guide/tasks/${id}/start`);
    if (!response.data.success) {
      throw new Error(response.data.message || '开始行程失败');
    }
    return response.data.data!;
  },

  completeTour: async (id: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/guide/tasks/${id}/complete`);
    if (!response.data.success) {
      throw new Error(response.data.message || '完成行程失败');
    }
    return response.data.data!;
  },

  getTourists: async (groupId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/guide/tasks/${groupId}/tourists`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取游客列表失败');
    }
    return response.data.data!;
  },

  getReports: async (groupId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>(`/guide/tasks/${groupId}/reports`, {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取报告列表失败');
    }
    return response.data.data!;
  },

  createReport: async (data: any): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/guide/reports', data);
    if (!response.data.success) {
      throw new Error(response.data.message || '创建报告失败');
    }
    return response.data.data!;
  },
};

export const formApi = {
  getTemplate: async (tourId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/forms/template/${tourId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取表单模板失败');
    }
    return response.data.data!;
  },

  saveTemplate: async (tourId: string, data: any): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/forms/template/${tourId}`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || '保存表单模板失败');
    }
    return response.data.data!;
  },

  getDefaults: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/forms/defaults');
    if (!response.data.success) {
      throw new Error(response.data.message || '获取默认字段失败');
    }
    return response.data.data!;
  },

  savePassengers: async (orderId: string, passengers: any[]): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/forms/passengers/${orderId}`, {
      passengers,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '保存乘客信息失败');
    }
    return response.data.data!;
  },
};

export const businessApi = {
  getTouristProfile: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/business/tourists/profile');
    if (!response.data.success) {
      throw new Error(response.data.message || '获取游客资料失败');
    }
    return response.data.data!;
  },

  getTouristHistory: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/business/tourists/history', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取历史订单失败');
    }
    return response.data.data!;
  },

  generateContract: async (orderId: string, data?: any): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/business/orders/${orderId}/contract`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || '生成合同失败');
    }
    return response.data.data!;
  },

  getNotice: async (orderId: string): Promise<string> => {
    const response = await api.get<ApiResponse<{ content: string }>>(`/business/orders/${orderId}/notice`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取出行通知失败');
    }
    return response.data.data!.content;
  },

  getInsuranceList: async (orderId: string): Promise<string> => {
    const response = await api.get<ApiResponse<{ content: string }>>(`/business/orders/${orderId}/insurance-list`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取保险清单失败');
    }
    return response.data.data!.content;
  },

  getSettlements: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/business/settlements', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取结算单列表失败');
    }
    return response.data.data!;
  },

  getSettlement: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/business/settlements/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取结算单详情失败');
    }
    return response.data.data!;
  },

  createSettlement: async (groupId: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/business/settlements/group/${groupId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || '创建结算单失败');
    }
    return response.data.data!;
  },

  calculateSettlement: async (groupId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/business/settlements/group/${groupId}/calculate`);
    if (!response.data.success) {
      throw new Error(response.data.message || '计算结算数据失败');
    }
    return response.data.data!;
  },

  updateSettlementCosts: async (id: string, costItems: any[]): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/business/settlements/${id}/costs`, {
      costItems,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '更新成本项失败');
    }
    return response.data.data!;
  },

  completeSettlement: async (id: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/business/settlements/${id}/complete`);
    if (!response.data.success) {
      throw new Error(response.data.message || '完成结算失败');
    }
    return response.data.data!;
  },

  getSettlementReport: async (id: string): Promise<string> => {
    const response = await api.get<ApiResponse<{ content: string }>>(`/business/settlements/${id}/report`);
    if (!response.data.success) {
      throw new Error(response.data.message || '获取结算报告失败');
    }
    return response.data.data!.content;
  },

  getBusinessStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/business/statistics/business', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || '获取经营统计失败');
    }
    return response.data.data!;
  },
};

export default api;
