import { request } from './api';

export interface LoginParams {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  userInfo: {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    investorLevel: string;
  };
}

export interface DashboardStats {
  totalInvestment: number;
  totalRevenue: number;
  deviceCount: number;
  onlineRate: number;
  dailyWaterConsumption: number;
  unitPrice: number;
  maintenanceCost: number;
  roi: number;
  paybackPeriod: number;
  paybackProgress: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export interface ProjectItem {
  id: string;
  name: string;
  location: string;
  deviceCount: number;
  investment: number;
  revenue: number;
  roi: number;
  onlineRate: number;
  status: 'active' | 'pending' | 'stopped';
  createTime: string;
}

export interface DeviceMapItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'fault';
  projectName: string;
  lastHeartbeat: string;
  temperature: number;
  todayYield: number;
}

export interface DeviceDetail {
  id: string;
  name: string;
  model: string;
  projectName: string;
  location: string;
  installDate: string;
  status: 'online' | 'offline' | 'fault';
  runHours: number;
  temperature: number;
  pressure: number;
  todayWater: number;
  totalWater: number;
  todayRevenue: number;
  totalRevenue: number;
  faultCodes: {
    code: string;
    description: string;
    time: string;
    level: 'warning' | 'error' | 'critical';
  }[];
  energyCurve: {
    time: string;
    value: number;
  }[];
  revenueStats: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

export interface EnergyCurveParams {
  deviceId?: string;
  period: '24h' | '7d' | '30d' | '90d';
}

export interface EnergyCurveResponse {
  time: string[];
  energy: number[];
  temperature: number[];
  power: number[];
}

export interface ReportItem {
  id: string;
  name: string;
  type: 'roi' | 'water' | 'fault';
  period: string;
  generateTime: string;
  status: 'generated' | 'generating' | 'failed';
  downloadUrl?: string;
}

export const investorApi = {
  login: (params: LoginParams) => request.post<LoginResponse>('/auth/login', params),

  sendSmsCode: (phone: string) => request.post('/auth/send-code', { phone }),

  getDashboard: () => request.get<DashboardStats>('/investor/dashboard'),

  getProjects: (params?: { page?: number; pageSize?: number }) =>
    request.get<{ list: ProjectItem[]; total: number }>('/investor/projects', { params }),

  getDevicesMap: () => request.get<DeviceMapItem[]>('/investor/devices-map'),

  getDeviceDetails: (id: string) => request.get<DeviceDetail>(`/investor/device/${id}/details`),

  getEnergyCurve: (params: EnergyCurveParams) =>
    request.get<EnergyCurveResponse>('/investor/energy-curve', { params }),

  getROI: (params?: { projectId?: string; period?: string }) =>
    request.get('/investor/roi', { params }),

  getFaultStatistics: (params?: { period?: string }) =>
    request.get('/investor/fault-statistics', { params }),

  getReports: (params?: { type?: string }) =>
    request.get<ReportItem[]>('/investor/reports', { params }),

  generateReport: (type: string, period: string) =>
    request.post<ReportItem>('/investor/reports/generate', { type, period }),

  downloadReport: (id: string) => request.get(`/investor/reports/${id}/download`),
};

export default investorApi;
