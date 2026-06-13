import http from './index';
import type {
  InsuranceType,
  QueryRange,
  AccountBalance,
  PaymentDetail,
  BenefitRecord,
  CompareChartData,
  PaginatedResponse,
} from '@shared/types/social-insurance';

export const socialInsuranceApi = {
  getBalance(insuranceType: InsuranceType): Promise<AccountBalance> {
    return http.get('/social-insurance/balance', { params: { insuranceType } });
  },

  getPayments(
    insuranceType: InsuranceType,
    range: QueryRange,
    page: number = 1,
    size: number = 10
  ): Promise<PaginatedResponse<PaymentDetail>> {
    return http.get('/social-insurance/payments', {
      params: { insuranceType, range, page, size },
    });
  },

  getBenefits(
    insuranceType: InsuranceType,
    page: number = 1,
    size: number = 10
  ): Promise<PaginatedResponse<BenefitRecord>> {
    return http.get('/social-insurance/benefits', {
      params: { insuranceType, page, size },
    });
  },

  getCompareChart(
    insuranceType: InsuranceType,
    year: number
  ): Promise<CompareChartData[]> {
    return http.get('/social-insurance/compare-chart', {
      params: { insuranceType, year },
    });
  },
};
