// 社保查询模块类型定义
export type InsuranceType = 'PENSION' | 'UNEMPLOYMENT' | 'INJURY' | 'MATERNITY';
export type QueryRange = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type CompareDimension = 'PAYMENT_BASE' | 'PERSONAL_AMOUNT' | 'TOTAL_AMOUNT' | 'BENEFIT_AMOUNT';

export const InsuranceTypeMap: Record<InsuranceType, string> = {
  PENSION: '养老保险',
  UNEMPLOYMENT: '失业保险',
  INJURY: '工伤保险',
  MATERNITY: '生育保险'
};

export const InsuranceTypeShortMap: Record<InsuranceType, string> = {
  PENSION: '养老',
  UNEMPLOYMENT: '失业',
  INJURY: '工伤',
  MATERNITY: '生育'
};

export interface AccountBalance {
  insuranceType: InsuranceType;
  personalAccount: number;
  pooledAccount: number;
  updatedAt: string;
}

export interface PaymentDetail {
  period: string;
  paymentBase: number;
  personalAmount: number;
  companyAmount: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID' | 'ARREARS';
}

export const PaymentStatusMap: Record<PaymentDetail['status'], string> = {
  PAID: '已缴',
  UNPAID: '未缴',
  ARREARS: '欠缴'
};

export interface BenefitRecord {
  issueDate: string;
  itemName: string;
  amount: number;
  bankAccountMasked: string;
  status: 'ISSUED' | 'PENDING' | 'FAILED';
}

export const BenefitStatusMap: Record<BenefitRecord['status'], string> = {
  ISSUED: '已发放',
  PENDING: '待发放',
  FAILED: '发放失败'
};

export interface CompareChartData {
  period: string;
  currentValue: number;
  yoyValue: number;
  momValue: number;
  yoyChange: number;
  momChange: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
}
