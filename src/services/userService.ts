import { http } from '@/utils/request';
import { User, LoginParams, LoginResult, DeviceInfo } from '@/types/user';

export const userService = {
  async login(params: LoginParams): Promise<LoginResult> {
    const res = await http.post<LoginResult>('/auth/login', params, { needEncrypt: true });
    return res.data;
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout');
  },

  async getUserInfo(): Promise<User> {
    const res = await http.get<User>('/user/info');
    return res.data;
  },

  async updateUserInfo(data: Partial<User>): Promise<User> {
    const res = await http.put<User>('/user/info', data);
    return res.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await http.post('/user/password', { oldPassword, newPassword });
  },

  async getLoginDevices(): Promise<DeviceInfo[]> {
    const res = await http.get<DeviceInfo[]>('/user/devices');
    return res.data;
  },

  async removeDevice(deviceId: string): Promise<void> {
    await http.delete(`/user/devices/${deviceId}`);
  },

  async enableBioAuth(enabled: boolean): Promise<void> {
    await http.post('/user/bio-auth', { enabled });
  },

  async updateBioAuth(enabled: boolean): Promise<void> {
    await http.post('/user/bio-auth', { enabled });
  },

  async verifyBioAuth(): Promise<boolean> {
    const res = await http.post<boolean>('/user/bio-auth/verify');
    return res.data;
  },

  async getSsoToken(systemCode: string): Promise<string> {
    const res = await http.post<string>('/auth/sso', { systemCode });
    return res.data;
  },

  async updateSecuritySetting(settingId: string, enabled: boolean): Promise<void> {
    await http.post('/user/security-settings', { settingId, enabled });
  }
};

export default userService;
