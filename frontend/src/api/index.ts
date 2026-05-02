import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse, User, AssetMaster, AssetDetail, DashboardData, Message, TimelineRecord } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
  (response: AxiosResponse) => {
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
  login: async (username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/auth/users');
    return response.data;
  }
};

export const assetApi = {
  register: async (data: {
    assetDetails: Array<{
      assetName: string;
      assetType: string;
      spec: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      purchaseDate: string;
      supplier: string;
      location: string;
      department: string;
      managerId: string;
      useLife: number;
      residualValueRate: number;
      depreciationMethod: string;
    }>;
    attachments: Array<{
      fileName: string;
      fileType: string;
      fileSize: number;
      fileUrl: string;
    }>;
    expectedCompleteTime: string;
  }): Promise<ApiResponse<{ masterId: string; masterNo: string; messages: string[] }>> => {
    const response = await api.post('/assets/register', data);
    return response.data;
  },

  getList: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }): Promise<ApiResponse<{
    list: Array<AssetMaster & { createdByName: string; handlerName: string; detailCount: number; totalAmount: number }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const response = await api.get('/assets', { params });
    return response.data;
  },

  getDetail: async (masterId: string): Promise<ApiResponse<{
    master: AssetMaster;
    details: Array<AssetDetail & { qrCode: string; managerName: string }>;
    timelines: Array<TimelineRecord & { userName: string }>;
  }>> => {
    const response = await api.get(`/assets/${masterId}`);
    return response.data;
  },

  receive: async (masterId: string, remarks?: string): Promise<ApiResponse<{ newStatus: string }>> => {
    const response = await api.post('/assets/receive', { masterId, remarks });
    return response.data;
  },

  getByQRCode: async (qrCode: string): Promise<ApiResponse<AssetDetail>> => {
    const response = await api.get(`/assets/qr/${qrCode}`);
    return response.data;
  }
};

export const workflowApi = {
  getPendingDepreciation: async (): Promise<ApiResponse<Array<{
    masterId: string;
    masterNo: string;
    assetDetailId: string;
    assetCode: string;
    assetName: string;
    totalPrice: number;
    useLife: number;
    residualValueRate: number;
    depreciationMethod: string;
    department: string;
    managerName: string;
  }>>> => {
    const response = await api.get('/workflow/depreciation/pending');
    return response.data;
  },

  calculateDepreciation: async (assetDetailId: string, masterId: string): Promise<ApiResponse<{
    period: string;
    originalValue: number;
    accumulatedDepreciation: number;
    netValue: number;
    depreciationAmount: number;
    depreciationMethod: string;
  }>> => {
    const response = await api.post('/workflow/depreciation/calculate', { assetDetailId, masterId });
    return response.data;
  },

  approveDepreciation: async (data: {
    recordId: string;
    masterId: string;
    assetDetailId: string;
    action: 'APPROVE' | 'REJECT' | 'SUPPLEMENT' | 'REASSIGN';
    remarks: string;
    reassignTo?: string;
  }): Promise<ApiResponse<{ status: string }>> => {
    const response = await api.post('/workflow/depreciation/approve', data);
    return response.data;
  },

  getPendingInventory: async (): Promise<ApiResponse<Array<{
    masterId: string;
    masterNo: string;
    assetDetailId: string;
    assetCode: string;
    assetName: string;
    location: string;
    department: string;
    qrCode: string;
  }>>> => {
    const response = await api.get('/workflow/inventory/pending');
    return response.data;
  },

  submitInventory: async (data: {
    masterId: string;
    assetDetailId: string;
    inventoryResult: 'NORMAL' | 'MISSING' | 'DAMAGED' | 'TRANSFERRED';
    actualQuantity: number;
    remarks: string;
    qrScanned: boolean;
    qrCode?: string;
  }): Promise<ApiResponse<{
    inventoryId: string;
    newStatus: string;
    warnings: string[];
  }>> => {
    const response = await api.post('/workflow/inventory/submit', data);
    return response.data;
  },

  initiateTransfer: async (data: {
    masterId: string;
    assetDetailId: string;
    fromDepartment: string;
    fromManagerId: string;
    toDepartment: string;
    toManagerId: string;
    transferReason: string;
  }): Promise<ApiResponse<{
    transferId: string;
    newStatus: string;
  }>> => {
    const response = await api.post('/workflow/transfer/initiate', data);
    return response.data;
  },

  initiateScrap: async (data: {
    masterId: string;
    assetDetailId: string;
    scrapReason: string;
    scrapValue: number;
  }): Promise<ApiResponse<{
    scrapId: string;
    newStatus: string;
  }>> => {
    const response = await api.post('/workflow/scrap/initiate', data);
    return response.data;
  },

  getPendingTransfers: async (): Promise<ApiResponse<Array<{
    id: string;
    masterId: string;
    assetDetailId: string;
    masterNo: string;
    assetCode: string;
    assetName: string;
    fromDepartment: string;
    fromManagerId: string;
    toDepartment: string;
    toManagerId: string;
    transferReason: string;
    status: string;
    createdAt: string;
    fromManagerName: string;
    toManagerName: string;
  }>>> => {
    const response = await api.get('/workflow/transfer/pending');
    return response.data;
  },

  getPendingScraps: async (): Promise<ApiResponse<Array<{
    id: string;
    masterId: string;
    assetDetailId: string;
    masterNo: string;
    assetCode: string;
    assetName: string;
    scrapReason: string;
    scrapValue: number;
    approvalStatus: string;
    createdAt: string;
    assetTotalPrice: number;
  }>>> => {
    const response = await api.get('/workflow/scrap/pending');
    return response.data;
  },

  processApproval: async (data: {
    masterId: string;
    assetDetailId: string;
    approvalType: 'TRANSFER' | 'SCRAP';
    action: 'APPROVE' | 'REJECT';
    remarks: string;
  }): Promise<ApiResponse<{ newStatus: string }>> => {
    const response = await api.post('/workflow/approval/process', data);
    return response.data;
  }
};

export const messageApi = {
  getList: async (params: {
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{
    list: Message[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    stats: {
      unreadCount: number;
      todoCount: number;
    };
  }>> => {
    const response = await api.get('/messages', { params });
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<{
    messages: {
      unread: number;
      todo: number;
      notification: number;
      alert: number;
    };
    workflow: {
      pendingRegister: number;
      pendingReceive: number;
      pendingDepreciation: number;
      pendingInventory: number;
      pendingTransfer: number;
      pendingScrap: number;
    };
  }>> => {
    const response = await api.get('/messages/stats');
    return response.data;
  },

  markAsRead: async (messageId: string): Promise<ApiResponse> => {
    const response = await api.post(`/messages/${messageId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse> => {
    const response = await api.post('/messages/read-all');
    return response.data;
  }
};

export const reportApi = {
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getDepreciationSummary: async (params: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{
    summary: {
      totalOriginalValue: number;
      totalAccumulatedDepreciation: number;
      totalNetValue: number;
    };
    list: Array<{
      id: string;
      assetCode: string;
      assetName: string;
      assetType: string;
      totalPrice: number;
      depreciationMethod: string;
      useLife: number;
      residualValueRate: number;
      department: string;
      status: AssetStatus;
      managerName: string;
      accumulatedDepreciation: number;
      netValue: number;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const response = await api.get('/reports/depreciation-summary', { params });
    return response.data;
  },

  getInventoryHistory: async (params: {
    page?: number;
    pageSize?: number;
    assetDetailId?: string;
  }): Promise<ApiResponse<{
    list: Array<{
      id: string;
      masterId: string;
      assetDetailId: string;
      inventoryDate: string;
      inventoryResult: string;
      inventoryBy: string;
      qrScanned: boolean;
      actualQuantity: number;
      systemQuantity: number;
      difference: number;
      remarks: string;
      status: string;
      createdAt: string;
      assetCode: string;
      assetName: string;
      inventoryByName: string;
    }>;
    resultCounts: Array<{ inventoryResult: string; count: number }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const response = await api.get('/reports/inventory-history', { params });
    return response.data;
  },

  getOperationLogs: async (params: {
    page?: number;
    pageSize?: number;
    masterId?: string;
  }): Promise<ApiResponse<{
    list: Array<{
      id: string;
      masterId: string;
      assetDetailId: string;
      userId: string;
      action: string;
      previousStatus: string;
      newStatus: string;
      remarks: string;
      ip: string;
      userAgent: string;
      createdAt: string;
      userName: string;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const response = await api.get('/reports/operation-logs', { params });
    return response.data;
  }
};

export default api;
