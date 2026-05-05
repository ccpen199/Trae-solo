import request from './axios';
import { ApiResponse, LogisticsOrder, LogisticsCategory } from '@/types';

export interface CreateLogisticsParams {
  logisticsNo: string;
  proxyNo?: string;
  productionEnterpriseCode?: string;
  productionEnterpriseName?: string;
  initiatorEnterpriseCode?: string;
  initiatorEnterpriseName?: string;
  transferEnterpriseCode?: string;
  transferEnterpriseName?: string;
  receiverEnterpriseCode?: string;
  receiverEnterpriseName?: string;
  goodsName: string;
  quantity?: number;
  unit?: string;
  weight?: number;
  volume?: number;
  shipmentDate?: string;
  expectedDeliveryDate?: string;
  shipmentAddress?: string;
  deliveryAddress?: string;
  remark?: string;
}

export interface GetLogisticsListParams {
  page?: number;
  pageSize?: number;
  logisticsNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetLogisticsListResult {
  orders: LogisticsOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export const logisticsApi = {
  create: (params: CreateLogisticsParams): Promise<ApiResponse<LogisticsOrder>> => {
    return request.post('/logistics/create', params);
  },

  createOrder: (params: CreateLogisticsParams): Promise<ApiResponse<LogisticsOrder>> => {
    return request.post('/logistics/create', params);
  },

  uploadFile: (file: File): Promise<ApiResponse<{
    success: number;
    failed: number;
    errors: string[];
  }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/logistics/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getList: (
    category: LogisticsCategory,
    params: GetLogisticsListParams
  ): Promise<ApiResponse<GetLogisticsListResult>> => {
    return request.get(`/logistics/list/${category}`, { params });
  },

  getDetail: (id: string): Promise<ApiResponse<LogisticsOrder>> => {
    return request.get(`/logistics/detail/${id}`);
  },

  exportOrders: (ids: string[]): Promise<Blob> => {
    return request.post('/logistics/export', { ids }, { responseType: 'blob' });
  },

  exportExcel: (ids: string[]): Promise<Blob> => {
    return request.post('/logistics/export', { ids }, { responseType: 'blob' });
  },
};

export const logisticsService = logisticsApi;
