import { post, get } from '@/utils/request';
import type { LoginParams, RealNameAuthParams, FaceAuthParams } from '@/types/user';
import { mockUserInfo } from '@/data/user';
import { useAuthStore, useUserStore } from '@/store';

export const login = async (params: LoginParams): Promise<boolean> => {
  console.log('[AuthService] 登录', params.phone || params.idCard);
  
  const success = await useAuthStore.getState().login(params);
  if (success) {
    const userInfo = useAuthStore.getState().userInfo;
    if (userInfo) {
      useUserStore.getState().setUserInfo(userInfo);
    }
  }
  return success;
};

export const logout = (): void => {
  console.log('[AuthService] 退出登录');
  useAuthStore.getState().logout();
  useUserStore.getState().clearUser();
};

export const realNameAuth = async (params: RealNameAuthParams): Promise<boolean> => {
  console.log('[AuthService] 实名认证', params.name);
  return await useAuthStore.getState().realNameAuth(params);
};

export const faceAuth = async (params: FaceAuthParams): Promise<boolean> => {
  console.log('[AuthService] 人脸核验');
  return await useAuthStore.getState().faceAuth(params);
};

export const checkAuth = (): boolean => {
  return useAuthStore.getState().checkAuth();
};

export const getCurrentUser = () => {
  return useAuthStore.getState().userInfo || mockUserInfo;
};

export const sendSmsCode = async (phone: string): Promise<boolean> => {
  console.log('[AuthService] 发送验证码', phone);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('[AuthService] 验证码已发送');
  return true;
};

export const verifySmsCode = async (phone: string, code: string): Promise<boolean> => {
  console.log('[AuthService] 验证验证码', phone, code);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return code === '123456';
};

export const getGovernmentAuthUrl = (): string => {
  return 'https://zwfw.jiangsu.gov.cn/xxmh/html/index_login.html?appid=jshrss';
};

export const governmentAuthCallback = async (code: string): Promise<boolean> => {
  console.log('[AuthService] 政务中台认证回调', code);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockToken = `gov_token_${Date.now()}`;
  const userInfo = {
    ...mockUserInfo,
    id: `gov_user_${Date.now()}`
  };
  
  useAuthStore.setState({
    isLoggedIn: true,
    token: mockToken,
    userInfo,
    loginTime: new Date().toISOString()
  });
  
  useUserStore.getState().setUserInfo(userInfo);
  
  return true;
};
