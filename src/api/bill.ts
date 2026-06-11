import { http } from '../utils/request';
import type { ApiResponse, PageResult, BillStatus, InvoiceStatus } from '../../shared/types';

export interface BillListItem {
  id: string;
  billNo: string;
  orderId: string;
  orderNo: string;
  cargoName: string;
  waybillId: string;
  waybillNo: string;
  ownerName: string;
  amount: number;
  type: 'receivable' | 'payable';
  status: BillStatus;
  invoiceStatus: InvoiceStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface BillDetail {
  id: string;
  billNo: string;
  order: {
    id: string;
    orderNo: string;
    cargoName: string;
    startCity: string;
    endCity: string;
  };
  waybill: {
    id: string;
    waybillNo: string;
  };
  owner: {
    name: string;
    company: string;
    phone: string;
  };
  amount: number;
  type: 'receivable' | 'payable';
  status: BillStatus;
  invoiceStatus: InvoiceStatus;
  invoice: {
    id: string;
    invoiceNo: string;
    type: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    buyerInfo: {
      companyName: string;
      taxNumber: string;
      address?: string;
      phone?: string;
      bank?: string;
      bankAccount?: string;
    };
    status: string;
    issuedAt: string | null;
    pdfUrl: string | null;
  } | null;
  createdAt: string;
  paidAt: string | null;
}

export const billApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: BillStatus;
    type?: 'receivable' | 'payable';
  }): Promise<ApiResponse<PageResult<BillListItem>>> => {
    return http.get<ApiResponse<PageResult<BillListItem>>>('/bills', { params });
  },

  getDetail: (id: string): Promise<ApiResponse<BillDetail>> => {
    return http.get<ApiResponse<BillDetail>>(`/bills/${id}`);
  },

  applyInvoice: (id: string, data: {
    type: 'vat_special' | 'vat_normal';
    buyerInfo: {
      companyName: string;
      taxNumber: string;
      address?: string;
      phone?: string;
      bank?: string;
      bankAccount?: string;
    };
  }): Promise<ApiResponse<{ id: string; invoiceNo: string; status: string }>> => {
    return http.post<ApiResponse<{ id: string; invoiceNo: string; status: string }>>(`/bills/${id}/invoice`, data);
  },
};

export default billApi;
