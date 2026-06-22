export * from './user';
export * from './activity';
export * from './bubbleRoom';
export * from './safety';
export * from './matching';
export * from './risk';
export * from './ai';
export * from './localService';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
