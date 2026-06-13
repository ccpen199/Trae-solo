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
    insureStatus: 'NORMAL' | 'SUSPENDED' | 'RETIRED';
  };
}

export interface TokenRefreshRequest {
  refreshToken: string;
}
