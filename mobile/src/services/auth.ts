import { request } from '@/utils/request';
import type { User, CACertificate } from '@/types';
import { mockUser, mockCertificate } from '@/data/mock';

export const loginWithGov = async (code: string): Promise<User> => {
  console.log('[AuthService] 省级政务平台统一身份认证，code:', code);
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockUser;
};

export const realNameVerify = async (params: { name: string; idCard: string }): Promise<boolean> => {
  console.log('[AuthService] 实名认证请求:', params.name);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};

export const biometricVerify = async (type: 'face' | 'fingerprint'): Promise<{ success: boolean; score: number }> => {
  console.log('[AuthService] 生物特征核验:', type);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, score: 98.5 };
};

export const getUserCert = async (): Promise<CACertificate> => {
  console.log('[CertService] 获取用户CA证书');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCertificate;
};

export const refreshCert = async (): Promise<CACertificate> => {
  console.log('[CertService] 续期CA证书');
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { ...mockCertificate, validTo: '2027-01-01 23:59:59' };
};

export const logoutApi = async (): Promise<void> => {
  console.log('[AuthService] 退出登录');
};
