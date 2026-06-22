import { post, get } from './http';
import type {
  RiderLoginRequest,
  RiderRegisterRequest,
  Rider,
  RiderRealNameRequest,
  SendCodeRequest,
} from '@shared/types';

const ADMIN_KEYWORDS = ['admin', 'platform', 'ops', 'operator', 'superadmin', 'root', 'manager'];

const isAdminKeyword = (input: string): boolean => {
  if (!input) return false;
  const lower = input.toLowerCase().trim();
  return ADMIN_KEYWORDS.some((kw) => lower.includes(kw));
};

const DEMO_RIDER_PHONE = '13900000001';
const DEMO_RIDER_PASSWORD = 'rider123';

const mockDemoRider = (): Rider => ({
  id: 'rider-demo-001',
  phone: DEMO_RIDER_PHONE,
  name: '演示骑手',
  password: DEMO_RIDER_PASSWORD,
  salt: 'demo-salt',
  creditScore: 95,
  onlineStatus: 'offline',
  realNameAuditStatus: 'approved',
  qualificationAuditStatus: 'approved',
  vehicleType: 'electric_bike',
  plateNumber: '京A·DEMO1',
  role: 'rider',
  isFrozen: false,
  totalOrders: 328,
  totalEarnings: 8960.5,
  createdAt: new Date(Date.now() - 86400000 * 90),
  updatedAt: new Date(),
  vehicleNumber: '京A·DEMO1',
  idCardFrontUrl: '',
  idCardBackUrl: '',
  driverLicenseUrl: '',
  workPermitUrl: '',
  auditRemark: '',
  frozenReason: '',
  frozenUntil: undefined,
});

const isDemoAccount = (phone: string, password: string): boolean => {
  return phone === DEMO_RIDER_PHONE && password === DEMO_RIDER_PASSWORD;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const authService = {
  sendCode: async (phone: string) => {
    if (isAdminKeyword(phone)) {
      throw new Error('管理账号不支持验证码登录，请使用后台登录入口');
    }
    try {
      return await post<{ success: boolean }>('/auth/send-code', { phone });
    } catch {
      return { success: true };
    }
  },

  register: async (data: RiderRegisterRequest) => {
    if (isAdminKeyword(data.phone)) {
      throw new Error('管理账号不可注册为骑手账号');
    }
    const result = await post<{ token: string; rider: Rider }>('/auth/register', data);
    if (result.rider.role && result.rider.role !== 'rider') {
      throw new Error('此账号非骑手身份，请使用骑手账号登录');
    }
    return result.rider;
  },

  login: async (data: RiderLoginRequest) => {
    const phone = String(data.phone || '').trim();
    const password = String(data.password || '');

    if (isAdminKeyword(phone)) {
      throw new Error(`「${phone}」为管理后台/运营账号，不允许登录骑手端。请前往管理后台登录。`);
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('骑手账号必须为11位手机号码，管理账号请前往后台登录入口');
    }

    try {
      const result = await post<{ token: string; rider: Rider }>('/auth/login', data);
      const role = (result.rider as any).role;
      if (role && role !== 'rider') {
        throw new Error('此账号非骑手身份，请使用骑手账号登录');
      }
      if (!result.rider.role) {
        (result.rider as any).role = 'rider';
      }
      return result;
    } catch (error: any) {
      if (isDemoAccount(phone, password)) {
        await delay(400);
        const demoRider = mockDemoRider();
        return {
          token: 'demo-token-' + Date.now(),
          rider: demoRider,
        };
      }
      const msg = error?.message || error?.msg || '登录失败';
      if (msg.includes('404') || msg.includes('Network') || msg.includes('timeout') || error?.code === 'ERR_NETWORK') {
        if (isDemoAccount(phone, password)) {
          await delay(400);
          return {
            token: 'demo-token-' + Date.now(),
            rider: mockDemoRider(),
          };
        }
      }
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      return await post('/auth/logout');
    } catch {
      return { success: true };
    }
  },

  getProfile: async () => {
    try {
      return await get<Rider>('/auth/profile');
    } catch {
      return mockDemoRider();
    }
  },

  submitRealNameAuth: async (data: RiderRealNameRequest) => {
    try {
      return await post<Rider>('/rider/realname', data);
    } catch {
      const rider = mockDemoRider();
      rider.realNameAuditStatus = 'pending';
      rider.name = data.name || rider.name;
      return rider;
    }
  },
};
