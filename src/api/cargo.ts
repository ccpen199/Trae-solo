import { http } from '../utils/request';
import type { Cargo, CargoStatus, ApiResponse, PageResult } from '../../shared/types';

export interface CargoListQuery {
  status?: CargoStatus;
  startCity?: string;
  endCity?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCargoRequest {
  cargoName: string;
  cargoType: 'LTL' | 'FTL';
  weight?: number;
  volume?: number;
  quantity?: number;
  packageType?: string;
  startCity: string;
  endCity: string;
  startAddress: string;
  endAddress: string;
  pickupTime: string;
  deliveryTime?: string;
  temperatureReq?: { min: number; max: number; unit: 'celsius' | 'fahrenheit' } | null;
  insurance?: { enabled: boolean; type: string; amount: number; premium: number } | null;
  vehicleReq: { vehicleType: string; vehicleLength: number };
  expectedPrice: number;
}

export const cargoApi = {
  getList: (params: CargoListQuery): Promise<ApiResponse<PageResult<Cargo>>> => {
    return http.get<ApiResponse<PageResult<Cargo>>>('/cargo', { params });
  },
  getDetail: (id: string): Promise<ApiResponse<Cargo>> => {
    return http.get<ApiResponse<Cargo>>(`/cargo/${id}`);
  },
  create: (data: CreateCargoRequest): Promise<ApiResponse<{ id: string; orderNo: string }>> => {
    return http.post<ApiResponse<{ id: string; orderNo: string }>>('/cargo', data);
  },
  publish: (id: string): Promise<ApiResponse<{ id: string; status: string }>> => {
    return http.post<ApiResponse<{ id: string; status: string }>>(`/cargo/${id}/publish`);
  },
  assign: (id: string, data: { driverId: string; vehicleId: string; actualPrice: number }): Promise<ApiResponse<unknown>> => {
    return http.post<ApiResponse<unknown>>(`/cargo/${id}/assign`, data);
  },
  remove: (id: string): Promise<ApiResponse<null>> => {
    return http.delete<ApiResponse<null>>(`/cargo/${id}`);
  },
};

export default cargoApi;
