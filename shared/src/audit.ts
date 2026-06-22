import { BaseEntity, AuditStatus } from './common';

export type AuditType = 
  | 'real_name_auth' 
  | 'qualification_change' 
  | 'order_complaint' 
  | 'credit_appeal'
  | 'frozen_appeal'
  | 'vehicle_change';

export type AuditLevel = 'first' | 'second' | 'final';

export interface AuditFlow extends BaseEntity {
  type: AuditType;
  title: string;
  description?: string;
  applicantId: string;
  applicantType: 'rider' | 'system' | 'customer';
  data: Record<string, unknown>;
  currentLevel: AuditLevel;
  status: AuditStatus;
  auditLogs: AuditLog[];
  finalDecision?: 'approved' | 'rejected';
  finalRemark?: string;
  completedAt?: Date;
}

export interface AuditLog extends BaseEntity {
  flowId: string;
  auditorId: string;
  auditorName: string;
  level: AuditLevel;
  decision: AuditStatus;
  remark?: string;
  previousStatus: AuditStatus;
  nextStatus: AuditStatus;
}

export interface AuditAssignRequest {
  flowId: string;
  auditorId: string;
  level: AuditLevel;
}

export interface AuditDecisionRequest {
  flowId: string;
  decision: AuditStatus;
  remark?: string;
  level: AuditLevel;
}

export interface Complaint extends BaseEntity {
  orderId: string;
  reporterId: string;
  reporterType: 'customer' | 'rider' | 'system';
  type: 'late_delivery' | 'damaged' | 'lost' | 'rude' | 'other';
  description: string;
  photos?: string[];
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  handlerId?: string;
  resolution?: string;
  penaltyAmount?: number;
  creditChange?: number;
  appealDeadline?: Date;
  appealed: boolean;
}

export interface AppealRequest {
  complaintId: string;
  reason: string;
  evidence: string[];
}
