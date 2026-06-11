import request from './request';

export interface LoginParams {
  type: 'password' | 'sms' | 'wechat' | 'alipay';
  phone?: string;
  password?: string;
  smsCode?: string;
  wechatCode?: string;
  alipayCode?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  userInfo: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
}

export function login(params: LoginParams) {
  return request.post<unknown, LoginResult>('/auth/login', params);
}

export function sendSmsCode(phone: string) {
  return request.post('/auth/sms/send', { phone });
}

export function logout() {
  return request.post('/auth/logout');
}

export function getUserInfo() {
  return request.get('/auth/user/info');
}

export function refreshTokenApi(refreshToken: string) {
  return request.post('/auth/refresh', { refreshToken });
}
