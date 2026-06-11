import { http } from '../utils/request';
import type { ApiResponse, PageResult, FuelCard } from '../../shared/types';

export interface FuelCardItem {
  id: string;
  cardNo: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  balance: number;
  status: 'active' | 'frozen' | 'cancelled';
  createdAt: string;
}

export interface FuelTransactionItem {
  id: string;
  cardId: string;
  amount: number;
  type: 'recharge' | 'consume' | 'refund';
  waybillId: string | null;
  stationName: string | null;
  timestamp: string;
}

export const settlementApi = {
  payBill: (id: string): Promise<ApiResponse<{ id: string; status: string }>> => {
    return http.post<ApiResponse<{ id: string; status: string }>>(`/settlement/bills/${id}/pay`);
  },

  getFuelCards: (params: {
    page?: number;
    pageSize?: number;
    driverId?: string;
    status?: string;
  }): Promise<ApiResponse<PageResult<FuelCardItem>>> => {
    return http.get<ApiResponse<PageResult<FuelCardItem>>>('/settlement/fuel-cards', { params });
  },

  getFuelCardTransactions: (id: string, params?: {
    page?: number;
    pageSize?: number;
    type?: string;
  }): Promise<ApiResponse<PageResult<FuelTransactionItem>>> => {
    return http.get<ApiResponse<PageResult<FuelTransactionItem>>>(`/settlement/fuel-cards/${id}/transactions`, { params });
  },

  rechargeFuelCard: (id: string, amount: number): Promise<ApiResponse<{ id: string; cardId: string; amount: number; type: string }>> => {
    return http.post<ApiResponse<{ id: string; cardId: string; amount: number; type: string }>>(`/settlement/fuel-cards/${id}/recharge`, { amount });
  },

  consumeFuelCard: (id: string, data: {
    amount: number;
    waybillId?: string;
    stationName?: string;
  }): Promise<ApiResponse<{ id: string; cardId: string; amount: number; type: string; remainingBalance: number }>> => {
    return http.post<ApiResponse<{ id: string; cardId: string; amount: number; type: string; remainingBalance: number }>>(`/settlement/fuel-cards/${id}/consume`, data);
  },
};

export default settlementApi;
