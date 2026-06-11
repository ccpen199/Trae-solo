import request from './request';
import type { Bill, PaymentRecord, Voucher, PaymentStatistics, PageResult } from '@/types';

export const paymentApi = {
  getBillList: (params: {
    householdId?: number;
    serviceType?: string;
    billingPeriod?: string;
    status?: number;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<Bill>>('/payment/bill/list', { params });
  },

  getBillDetail: (id: number) => {
    return request.get<Bill>(`/payment/bill/${id}`);
  },

  getUnpaidBills: (householdId?: number) => {
    return request.get<Bill[]>('/payment/bill/unpaid', { params: { householdId } });
  },

  createPayment: (data: { billIds: number[]; payMethod: string }) => {
    return request.post<{ paymentNo: string; totalAmount: number; payParams: any }>(
      '/payment/create',
      data
    );
  },

  queryPayment: (paymentNo: string) => {
    return request.get<{ status: number; paymentNo: string }>(`/payment/query/${paymentNo}`);
  },

  getPaymentRecords: (params: {
    startTime?: string;
    endTime?: string;
    serviceType?: string;
    status?: number;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<PaymentRecord>>('/payment/records', { params });
  },

  getPaymentDetail: (id: number) => {
    return request.get<PaymentRecord>(`/payment/record/${id}`);
  },

  getVoucherList: (params: {
    startTime?: string;
    endTime?: string;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<Voucher>>('/payment/voucher/list', { params });
  },

  getVoucherDetail: (id: number) => {
    return request.get<Voucher>(`/payment/voucher/${id}`);
  },

  downloadVoucher: (id: number) => {
    return request.get(`/payment/voucher/download/${id}`, { responseType: 'blob' });
  },

  exportRecords: (params: {
    startTime?: string;
    endTime?: string;
    serviceType?: string;
    status?: number;
  }) => {
    return request.get('/payment/records/export', { params, responseType: 'blob' });
  },
};

export const reportApi = {
  getPaymentStatistics: (params: {
    startTime?: string;
    endTime?: string;
    type?: 'day' | 'month' | 'year';
  }) => {
    return request.get<PaymentStatistics>('/report/payment/statistics', { params });
  },
};
