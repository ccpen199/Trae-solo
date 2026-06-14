import axios from 'axios';
import type {
  FamilyMutualAid,
  PensionPayment,
  PaymentWarning,
  AuditRule,
} from '@shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FamilyMember extends FamilyMutualAid {
  relationshipText: string;
}

export interface FamilyUsageRecord {
  id: number;
  memberName: string;
  amount: number;
  usageType: string;
  hospital: string;
  date: string;
}

export interface MedicalRecord {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  hospital?: string;
}

export interface PensionEstimateResult {
  basicPension: number;
  personalPension: number;
  totalPension: number;
  details: {
    hunanAverageSalary: number;
    indexedAverageSalary: number;
    formula: string;
    personalAccountMonths: number;
    annualIncrease: number;
  };
}

export interface DataCompareResult {
  publicSecurity: {
    totalRecords: number;
    matchedRecords: number;
    unmatchedRecords: number;
    matchRate: number;
  };
  health: {
    totalRecords: number;
    matchedRecords: number;
    unmatchedRecords: number;
    matchRate: number;
  };
  civilAffairs: {
    totalRecords: number;
    matchedRecords: number;
    unmatchedRecords: number;
    matchRate: number;
  };
  abnormalRecords: Array<{
    id: number;
    userName: string;
    idCard: string;
    department: string;
    issue: string;
    status: string;
  }>;
  compareProgress: number;
  lastCompareTime: string;
}

export const familyApi = {
  getMembers: (params?: { page?: number; pageSize?: number }) =>
    api.get<unknown, ApiResponse<PaginatedResponse<FamilyMember>>>('/family/members', { params }),

  bindMember: (data: {
    relativeIdCard: string;
    relativeName: string;
    relationship: string;
    authAmount: number;
  }) => api.post<unknown, ApiResponse<FamilyMember>>('/family/bind', data),

  verifyWithPolice: (data: { idCard: string; name: string }) =>
    api.post<unknown, ApiResponse<{ valid: boolean; message: string }>>('/family/verify-police', data),

  adjustAmount: (id: number, data: { authAmount: number }) =>
    api.post<unknown, ApiResponse<FamilyMember>>(`/family/${id}/authorize`, data),

  unbind: (id: number) =>
    api.post<unknown, ApiResponse<{ message: string }>>(`/family/${id}/unbind`),

  getUsageRecords: () =>
    api.get<unknown, ApiResponse<FamilyUsageRecord[]>>('/family/usage-records'),
};

export const benefitApi = {
  getPensionList: (params?: { page?: number; pageSize?: number }) =>
    api.get<unknown, ApiResponse<PaginatedResponse<PensionPayment>>>('/benefit/pension', { params }),

  getPensionStats: () =>
    api.get<unknown, ApiResponse<{
      totalAmount: number;
      currentMonthAmount: number;
      averageAmount: number;
    }>>('/benefit/pension-stats'),

  getMedicalBalance: () =>
    api.get<unknown, ApiResponse<{ balance: number; lastUpdate: string }>>('/benefit/medical-balance'),

  getMedicalRecords: (params?: { page?: number; pageSize?: number }) =>
    api.get<unknown, ApiResponse<PaginatedResponse<MedicalRecord>>>('/benefit/medical', { params }),
};

export const calculatorApi = {
  estimatePension: (data: {
    payYears: number;
    payGrade: number;
    retirementAge: number;
    currentAge: number;
  }) => api.post<unknown, ApiResponse<PensionEstimateResult>>('/calculator/pension-estimate', data),
};

export const adminApi = {
  getWarnings: (params?: {
    page?: number;
    pageSize?: number;
    warningType?: string;
    severity?: string;
    status?: string;
    startTime?: string;
    endTime?: string;
  }) => api.get<unknown, ApiResponse<PaginatedResponse<PaymentWarning & { userName: string; idCard: string }>>>('/admin/warnings', { params }),

  handleWarning: (id: number, data: { handleNote: string; status: string }) =>
    api.post<unknown, ApiResponse<{ message: string }>>(`/admin/warnings/${id}/handle`, data),

  getAuditRules: (params?: { page?: number; pageSize?: number }) =>
    api.get<unknown, ApiResponse<PaginatedResponse<AuditRule>>>('/admin/audit-rules', { params }),

  createAuditRule: (data: {
    ruleName: string;
    ruleCode: string;
    ruleCondition: string;
    riskLevel: string;
    threshold: number;
    enabled: boolean;
  }) => api.post<unknown, ApiResponse<AuditRule>>('/admin/audit-rules', data),

  updateAuditRule: (id: number, data: {
    ruleName?: string;
    ruleCondition?: string;
    riskLevel?: string;
    threshold?: number;
    enabled?: boolean;
  }) => api.put<unknown, ApiResponse<AuditRule>>(`/admin/audit-rules/${id}`, data),

  toggleRule: (id: number, enabled: boolean) =>
    api.put<unknown, ApiResponse<AuditRule>>(`/admin/audit-rules/${id}`, { enabled }),

  getDataCompare: () =>
    api.get<unknown, ApiResponse<DataCompareResult>>('/admin/datashare/compare'),

  triggerCompare: () =>
    api.post<unknown, ApiResponse<DataCompareResult>>('/admin/datashare/compare'),
};

export default api;
