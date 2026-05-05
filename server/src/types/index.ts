import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  phone: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface RegisterParams {
  phone: string;
  password: string;
  nickname?: string;
}

export interface SearchParams {
  keyword?: string;
  cityId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  rating?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'rating' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface DateSelection {
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
}

export interface CreateBookingParams {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestPhone: string;
  specialRequest?: string;
}

export interface LocationSearchItem {
  name: string;
  type: string;
  typeLabel: string;
  cityId: string;
  cityName: string;
}
