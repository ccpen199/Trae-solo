import { http } from '../utils/request';
import type { ApiResponse, PageResult, Carrier, Driver, Vehicle, AuthStatus } from '../../shared/types';

export interface CarrierListItem {
  id: string;
  companyName: string;
  businessLicense: string;
  roadTransportPermit: string;
  contactName: string;
  contactPhone: string;
  rating: number;
  whitelist: boolean;
  authStatus: AuthStatus;
  createdAt: string;
}

export interface DriverListItem {
  id: string;
  userId: string;
  name: string;
  phone: string;
  idCard: string;
  driverLicense: string;
  driverLicenseType: string;
  qualificationCertificate: string | null;
  avatar: string | null;
  authStatus: AuthStatus;
  rating: number;
  totalOrders: number;
  fleetId: string | null;
  createdAt: string;
}

export interface VehicleListItem {
  id: string;
  plateNo: string;
  vehicleType: string;
  vehicleLength: number;
  maxLoad: number;
  maxVolume: number;
  color: string;
  drivingLicense: string;
  roadTransportPermit: string | null;
  insuranceExpireDate: string | null;
  annualInspectionDate: string | null;
  authStatus: AuthStatus;
  fleetId: string | null;
  currentDriverId: string | null;
  createdAt: string;
}

export const capacityApi = {
  getCarriers: (params: {
    page?: number;
    pageSize?: number;
    whitelist?: boolean;
    authStatus?: AuthStatus;
  }): Promise<ApiResponse<PageResult<CarrierListItem>>> => {
    return http.get<ApiResponse<PageResult<CarrierListItem>>>('/capacity/carriers', { params });
  },

  createCarrier: (data: {
    companyName: string;
    businessLicense: string;
    roadTransportPermit?: string;
    contactName: string;
    contactPhone: string;
  }): Promise<ApiResponse<{ id: string }>> => {
    return http.post<ApiResponse<{ id: string }>>('/capacity/carriers', data);
  },

  updateCarrier: (id: string, data: Partial<CarrierListItem>): Promise<ApiResponse<{ id: string }>> => {
    return http.put<ApiResponse<{ id: string }>>(`/capacity/carriers/${id}`, data);
  },

  getDrivers: (params: {
    page?: number;
    pageSize?: number;
    fleetId?: string;
    authStatus?: AuthStatus;
  }): Promise<ApiResponse<PageResult<DriverListItem>>> => {
    return http.get<ApiResponse<PageResult<DriverListItem>>>('/capacity/drivers', { params });
  },

  updateDriver: (id: string, data: { authStatus?: AuthStatus; fleetId?: string }): Promise<ApiResponse<{ id: string }>> => {
    return http.put<ApiResponse<{ id: string }>>(`/capacity/drivers/${id}`, data);
  },

  getVehicles: (params: {
    page?: number;
    pageSize?: number;
    fleetId?: string;
    authStatus?: AuthStatus;
  }): Promise<ApiResponse<PageResult<VehicleListItem>>> => {
    return http.get<ApiResponse<PageResult<VehicleListItem>>>('/capacity/vehicles', { params });
  },

  updateVehicle: (id: string, data: { authStatus?: AuthStatus; fleetId?: string; currentDriverId?: string }): Promise<ApiResponse<{ id: string }>> => {
    return http.put<ApiResponse<{ id: string }>>(`/capacity/vehicles/${id}`, data);
  },
};

export default capacityApi;
