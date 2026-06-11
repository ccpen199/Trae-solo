import request from './request';
import type { User, Household, PageResult } from '@/types';

export const userApi = {
  login: (data: { phone: string; password: string; captcha?: string }) => {
    return request.post<{ token: string; userInfo: User }>('/user/login', data);
  },

  register: (data: { phone: string; password: string; code: string; userType: number }) => {
    return request.post('/user/register', data);
  },

  getUserInfo: () => {
    return request.get<User>('/user/info');
  },

  updateUserInfo: (data: Partial<User>) => {
    return request.put('/user/info', data);
  },

  sendSmsCode: (phone: string, type: string) => {
    return request.post('/user/sms-code', { phone, type });
  },

  realNameAuth: (data: { realName: string; idCard: string }) => {
    return request.post('/user/real-name', data);
  },

  getHouseholdList: () => {
    return request.get<Household[]>('/user/household/list');
  },

  bindHousehold: (data: {
    householdNo: string;
    householdName: string;
    serviceType: string;
    captcha: string;
  }) => {
    return request.post<Household>('/user/household/bind', data);
  },

  unbindHousehold: (id: number) => {
    return request.delete(`/user/household/${id}`);
  },

  setDefaultHousehold: (id: number) => {
    return request.put(`/user/household/default/${id}`);
  },
};
