import { http } from '../utils/request';
import type { ApiResponse, PageResult, Waybill, WaybillStatus, GpsPoint } from '../../shared/types';

export interface WaybillListItem {
  id: string;
  waybillNo: string;
  cargoId: string;
  cargoName: string;
  startCity: string;
  endCity: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleId: string;
  plateNo: string;
  actualPrice: number;
  status: WaybillStatus;
  startTime: string | null;
  endTime: string | null;
  currentLocation: { lat: number; lng: number; timestamp: string } | null;
  createdAt: string;
}

export interface WaybillDetail {
  id: string;
  waybillNo: string;
  cargoId: string;
  cargo: {
    cargoName: string;
    cargoType: string;
    weight: number;
    volume: number;
    startCity: string;
    endCity: string;
    startAddress: string;
    endAddress: string;
    pickupTime: string;
  };
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleId: string;
  plateNo: string;
  actualPrice: number;
  status: WaybillStatus;
  startTime: string | null;
  endTime: string | null;
  currentLocation: { lat: number; lng: number; timestamp: string } | null;
  createdAt: string;
}

export const waybillApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: WaybillStatus;
    keyword?: string;
  }): Promise<ApiResponse<PageResult<WaybillListItem>>> => {
    return http.get<ApiResponse<PageResult<WaybillListItem>>>('/waybills', { params });
  },

  getDetail: (id: string): Promise<ApiResponse<WaybillDetail>> => {
    return http.get<ApiResponse<WaybillDetail>>(`/waybills/${id}`);
  },

  updateStatus: (id: string, status: WaybillStatus): Promise<ApiResponse<{ id: string; status: WaybillStatus }>> => {
    return http.put<ApiResponse<{ id: string; status: WaybillStatus }>>(`/waybills/${id}/status`, { status });
  },

  getTrack: (id: string, params?: { startTime?: string; endTime?: string }): Promise<ApiResponse<{ waybillId: string; track: GpsPoint[] }>> => {
    return http.get<ApiResponse<{ waybillId: string; track: GpsPoint[] }>>(`/waybills/${id}/track`, { params });
  },

  reportGps: (id: string, data: { lat: number; lng: number; speed?: number; direction?: number; ignition?: boolean }): Promise<ApiResponse<{ id: string; timestamp: string }>> => {
    return http.post<ApiResponse<{ id: string; timestamp: string }>>(`/waybills/${id}/gps`, data);
  },
};

export default waybillApi;
