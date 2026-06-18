export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type ApiResponse<T = unknown> = {
  code: number;
  message: string;
  data?: T;
};

export type FileUpload = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};
