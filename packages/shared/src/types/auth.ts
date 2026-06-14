// 认证模块类型定义
export interface GstLoginUrlResponse {
  redirectUrl: string;
  state: string;
}

export interface GstCallbackRequest {
  code: string;
  state: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userInfo: {
    id: string;
    nameMasked: string;
    idCardMasked: string;
    socialCardMasked: string;
    phoneMasked?: string;
    insureStatus: 'NORMAL' | 'SUSPENDED' | 'RETIRED';
    region?: string;
  };
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface LockStatusResponse {
  userId: string;
  failCount: number;
  maxFailCount: number;
  locked: boolean;
  lockExpiresAt?: number;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
  captcha?: string;
}

export interface AdminLoginResponse {
  token: string;
  refreshToken: string;
  adminInfo: {
    id: string;
    username: string;
    realNameMasked: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'AUDITOR';
    permissions: string[];
    lastLoginAt: string;
    lastLoginIp: string;
  };
}
