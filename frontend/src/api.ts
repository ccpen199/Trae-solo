import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58826/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface ReturnRequest {
  id: number;
  platform_order_id: string;
  sku: string;
  return_reason: string;
  buyer_description?: string;
  images?: string;
  tracking_number?: string;
  refund_amount: number;
  status: string;
  needs_manual_review: number;
  created_at: string;
  updated_at: string;
}

export interface WarehouseInspection {
  id: number;
  return_request_id: number;
  sku_verified: number;
  quantity: number;
  condition_level: string;
  has_damage: number;
  has_wrong_item: number;
  has_missing_parts: number;
  inspector_notes?: string;
  inspection_date: string;
  created_at: string;
}

export interface ProcessingDecision {
  id: number;
  return_request_id: number;
  decision_type: string;
  processing_cost: number;
  responsible_party: string;
  notes?: string;
  decided_by?: string;
  decided_at: string;
  created_at: string;
}

export interface Refund {
  id: number;
  return_request_id: number;
  platform_refund_status: string;
  seller_approved: number;
  warehouse_processed: number;
  refund_amount: number;
  refund_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const returnRequestsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) => 
    api.get('/return-requests', { params }),
  getById: (id: number) => api.get(`/return-requests/${id}`),
  create: (data: Partial<ReturnRequest>) => api.post('/return-requests', data),
  updateStatus: (id: number, status: string) => 
    api.patch(`/return-requests/${id}/status`, { status }),
  approve: (id: number) => api.post(`/return-requests/${id}/approve`)
};

export const warehouseApi = {
  inspect: (data: Partial<WarehouseInspection>) => api.post('/warehouse/inspect', data),
  getExceptions: () => api.get('/warehouse/exceptions'),
  resolveException: (id: number) => api.patch(`/warehouse/exceptions/${id}/resolve`)
};

export const processingApi = {
  createDecision: (data: Partial<ProcessingDecision>) => 
    api.post('/processing/decision', data),
  getDecisions: () => api.get('/processing/decisions'),
  getRestocks: () => api.get('/processing/restocks')
};

export const refundsApi = {
  getAll: () => api.get('/refunds'),
  approveSeller: (id: number) => api.post(`/refunds/${id}/approve-seller`),
  completePlatform: (id: number) => api.post(`/refunds/${id}/complete-platform`),
  getReports: () => api.get('/refunds/reports'),
  getReportDetails: (params?: any) => api.get('/refunds/reports/details', { params })
};

export default api;
