import { get, post, put } from './http';
import type { PaginationResult, AuditFlow, Complaint, AuditStatus } from '@shared/types';

export interface AuditListParams {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: AuditStatus;
  level?: string;
}

export interface AuditDecisionRequest {
  flowId: string;
  decision: AuditStatus;
  remark?: string;
  level: string;
}

export interface ComplaintListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface ComplaintHandleRequest {
  status: string;
  resolution: string;
  penaltyAmount?: number;
  creditChange?: number;
}

export const auditService = {
  getAuditFlows(params?: AuditListParams): Promise<PaginationResult<AuditFlow>> {
    return get('/admin/audit-flows', { params });
  },

  makeDecision(data: AuditDecisionRequest): Promise<AuditFlow> {
    return post('/admin/audit/decision', data);
  },

  getComplaints(params?: ComplaintListParams): Promise<PaginationResult<Complaint>> {
    return get('/admin/complaints', { params });
  },

  handleComplaint(id: string, data: ComplaintHandleRequest): Promise<Complaint> {
    return put(`/admin/complaints/${id}/handle`, data);
  },
};
