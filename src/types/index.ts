export * from '../../shared/types';

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface UserInfo {
  id: string;
  name: string;
  role: 'admin' | 'dispatcher' | 'rider' | 'customer';
  avatar?: string;
  email?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: React.ReactNode;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableAction<T> {
  key: string;
  label: string;
  icon?: string;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface TrendData {
  value?: number;
  direction: 'up' | 'down' | 'flat';
  percentage?: number;
  label: string;
}

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'exception' | 'delay' | 'urgent';

declare module '../../shared/types' {
  interface OrderAlert {
    read?: boolean;
  }
}

export interface ModalConfig {
  title: string;
  width?: string;
  footer?: React.ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
}

export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface StateStatus {
  loading: boolean;
  error: ApiError | null;
}
