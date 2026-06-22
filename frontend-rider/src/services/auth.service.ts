import { post, get } from './http';
import type {
  RiderLoginRequest,
  RiderRegisterRequest,
  Rider,
  RiderRealNameRequest,
  SendCodeRequest,
} from '@shared/types';

export const authService = {
  sendCode: (phone: string) => {
    return post<{ success: boolean }>('/auth/send-code', { phone });
  },

  register: (data: RiderRegisterRequest) => {
    return post<{ token: string; rider: Rider }>('/auth/register', data).then((result) => result.rider);
  },

  login: (data: RiderLoginRequest) => {
    return post<{ token: string; rider: Rider }>('/auth/login', data);
  },

  logout: () => {
    return post('/auth/logout');
  },

  getProfile: () => {
    return get<Rider>('/auth/profile');
  },

  submitRealNameAuth: (data: RiderRealNameRequest) => {
    return post<Rider>('/rider/realname', data);
  },
};
