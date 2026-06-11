import { http } from '../utils/request';
import type { CargoStatus, ApiResponse, PageResult } from '../../shared/types';

export interface OrderListItem {
  id: string;
  orderNo: string;
  ownerId: string;
  ownerName: string;
  ownerCompany: string;
  cargoName: string;
  cargoType: string;
  weight: number;
  volume: number;
  startCity: string;
  endCity: string;
  expectedPrice: number;
  status: CargoStatus;
  createdAt: string;
}

export interface OrderQuery {
  status?: CargoStatus;
  page?: number;
  pageSize?: number;
}

export const ordersApi = {
  getList: (params: OrderQuery): Promise<ApiResponse<PageResult<OrderListItem>>> => {
    return http.get<ApiResponse<PageResult<OrderListItem>>>('/orders', { params });
  },
  getDetail: (id: string): Promise<ApiResponse<unknown>> => {
    return http.get<ApiResponse<unknown>>(`/orders/${id}`);
  },
};

export default ordersApi;
