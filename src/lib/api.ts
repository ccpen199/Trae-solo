import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  StudentAccount,
  InvestorAccount,
  Device,
  DeviceWithDistance,
  WaterTransaction,
  RechargeRecord,
  RevenueRecord,
  DeviceDiagnosis,
  SemesterSummary,
} from '../../shared/types.js';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = (await res.json()) as ApiResponse<T>;
  if (data.code !== 200) {
    throw new Error(data.message);
  }
  return data.data as T;
}

export const authApi = {
  login: (data: LoginRequest) => request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<LoginResponse['user']>('/auth/me'),
};

export const studentApi = {
  profile: () => request<StudentAccount>('/student/profile'),
  transactions: (limit = 50, offset = 0) =>
    request<{ transactions: WaterTransaction[]; total: number }>(`/student/transactions?limit=${limit}&offset=${offset}`),
  transaction: (id: string) => request<WaterTransaction>(`/student/transactions/${id}`),
  semesters: () => request<string[]>('/student/summary/semesters'),
  summary: (semester?: string) =>
    request<SemesterSummary>(`/student/summary${semester ? `?semester=${encodeURIComponent(semester)}` : ''}`),
};

export const deviceApi = {
  nearby: (lat: number, lng: number, radius = 500) =>
    request<DeviceWithDistance[]>(`/devices/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getById: (id: string) => request<Device>(`/devices/${id}`),
};

export const transactionApi = {
  start: (deviceId: string) =>
    request<WaterTransaction>('/transactions/start', { method: 'POST', body: JSON.stringify({ deviceId }) }),
  update: (id: string, volume: number) =>
    request<WaterTransaction>(`/transactions/update/${id}`, { method: 'POST', body: JSON.stringify({ volume }) }),
  end: (id: string, volume: number, deviceId?: string) =>
    request<WaterTransaction>(`/transactions/end/${id}`, { method: 'POST', body: JSON.stringify({ volume, deviceId }) }),
};

export const paymentApi = {
  recharge: (amount: number, channel: 'alipay' | 'wechat') =>
    request<RechargeRecord>('/payment/recharge', { method: 'POST', body: JSON.stringify({ amount, channel }) }),
  pay: (id: string) =>
    request<RechargeRecord>(`/payment/recharge/${id}/pay`, { method: 'POST' }),
  records: () => request<RechargeRecord[]>('/payment/records'),
};

export const investorApi = {
  profile: () => request<InvestorAccount>('/investor/profile'),
  dashboard: () => request<{
    totalRevenue: number;
    availableBalance: number;
    onlineRate: number;
    totalDevices: number;
    faultDevices: number;
  }>('/investor/dashboard'),
  devices: () => request<Device[]>('/investor/devices'),
  revenue: (period?: string) =>
    request<RevenueRecord[]>(`/investor/revenue${period ? `?period=${encodeURIComponent(period)}` : ''}`),
  settleRevenue: (period: string) =>
    request<RevenueRecord[]>('/investor/revenue/settle', { method: 'POST', body: JSON.stringify({ period }) }),
  deviceTrend: (deviceId: string, days = 7) =>
    request<{ date: string; volume: number; revenue: number }[]>(`/investor/devices/${deviceId}/trend?days=${days}`),
  diagnosis: (deviceId: string) => request<DeviceDiagnosis[]>(`/investor/devices/${deviceId}/diagnosis`),
  diagnosisReport: (deviceId: string) =>
    request<{
      deviceName: string;
      generatedAt: number;
      overallStatus: string;
      issues: any[];
      metrics: any;
      recommendations: string[];
    }>(`/investor/devices/${deviceId}/diagnosis/report`),
};
