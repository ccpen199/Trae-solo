export type UserRole = 'owner' | 'store_admin' | 'store_staff' | 'store_manager' | 'veterinarian' | 'operator';

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  nickname?: string;
  avatar?: string;
  storeId?: string;
  veterinarianId?: string;
  licenseNo?: string;
  createdAt: string;
}

export interface LoginRequest {
  phone: string;
  password?: string;
  smsCode?: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}
