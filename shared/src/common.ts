export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Contact {
  name: string;
  phone: string;
  address?: string;
  location?: Coordinate;
}

export type AuditStatus = 'pending' | 'approved' | 'rejected';

export type OrderType = 'express' | 'takeout' | 'grocery' | 'medicine' | 'document' | 'other' | 'delivery' | 'pickup' | 'errands' | 'shopping';

export type VehicleType = 'walk' | 'bicycle' | 'electric_scooter' | 'bike' | 'electric_bike' | 'motorcycle' | 'car';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface TokenPayload {
  riderId: string;
  phone: string;
}
