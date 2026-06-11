import { http } from '../utils/request';
import type { ApiResponse } from '../../shared/types';

export interface ActiveWaybill {
  waybillId: string;
  waybillNo: string;
  status: string;
  location: { lat: number; lng: number; timestamp: string } | null;
  startTime: string | null;
  cargo: {
    name: string;
    startCity: string;
    endCity: string;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle: {
    id: string;
    plateNo: string;
    vehicleType: string;
  };
}

export const trackingApi = {
  getActive: (): Promise<ApiResponse<ActiveWaybill[]>> => {
    return http.get<ApiResponse<ActiveWaybill[]>>('/tracking/active');
  },
};

export default trackingApi;
