import type { PatientType, RiskLevel, OrderStatus, VerifyStatus, AuditStage, RiskType, TicketStatus, Severity, PolicyStatus } from '@/types';

export const PATIENT_TYPE_MAP: Record<PatientType, { label: string; color: string; bgColor: string; icon: string }> = {
  elderly: { label: '老年护理', color: '#F59E0B', bgColor: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'heart-handshake' },
  maternal: { label: '母婴护理', color: '#EC4899', bgColor: 'bg-pink-50 text-pink-700 border-pink-200', icon: 'baby' },
  'post-hospital': { label: '院后康复', color: '#3B82F6', bgColor: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'activity' },
  hospice: { label: '安宁疗护', color: '#8B5CF6', bgColor: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'feather' },
};

export const RISK_LEVEL_MAP: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: '低风险', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: '中风险', color: '#F59E0B', bgColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: '高风险', color: '#F97316', bgColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: '极高风险', color: '#EF4444', bgColor: 'bg-red-50 text-red-700 border-red-200' },
};

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  created: { label: '待评估', color: '#64748B', bgColor: 'bg-slate-100 text-slate-700' },
  'risk-assessed': { label: '待派单', color: '#6366F1', bgColor: 'bg-indigo-50 text-indigo-700' },
  dispatched: { label: '已派单', color: '#3B82F6', bgColor: 'bg-blue-50 text-blue-700' },
  'nurse-accepted': { label: '护士已接单', color: '#0EA5E9', bgColor: 'bg-sky-50 text-sky-700' },
  'in-service': { label: '服务中', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-700' },
  completed: { label: '已完成', color: '#059669', bgColor: 'bg-green-50 text-green-700' },
  cancelled: { label: '已取消', color: '#EF4444', bgColor: 'bg-red-50 text-red-700' },
};

export const VERIFY_STATUS_MAP: Record<VerifyStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待核验', color: '#64748B', bgColor: 'bg-slate-100 text-slate-700' },
  verifying: { label: '系统核验中', color: '#3B82F6', bgColor: 'bg-blue-50 text-blue-700' },
  verified: { label: '核验通过', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '核验驳回', color: '#EF4444', bgColor: 'bg-red-50 text-red-700' },
};

export const AUDIT_STAGE_MAP: Record<AuditStage, { label: string; color: string }> = {
  'self-check': { label: '护士自检', color: '#3B82F6' },
  'quality-control': { label: '机构质控', color: '#F59E0B' },
  'platform-check': { label: '平台巡检', color: '#8B5CF6' },
};

export const RISK_TYPE_MAP: Record<RiskType, { label: string; color: string }> = {
  'out-of-scope': { label: '超范围操作', color: '#DC2626' },
  'no-check-in': { label: '未签到服务', color: '#EA580C' },
  'recording-interrupt': { label: '录像中断', color: '#D97706' },
  'data-mismatch': { label: '数据不一致', color: '#CA8A04' },
  overtime: { label: '服务超时', color: '#65A30D' },
  complaint: { label: '患者投诉', color: '#0891B2' },
};

export const TICKET_STATUS_MAP: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: '待处理', color: '#EF4444', bgColor: 'bg-red-50 text-red-700 border-red-200' },
  investigating: { label: '调查中', color: '#F59E0B', bgColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: '已处理', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: '已关闭', color: '#64748B', bgColor: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const SEVERITY_MAP: Record<Severity, { label: string; color: string; dotColor: string }> = {
  low: { label: '一般', color: 'text-slate-600', dotColor: 'bg-slate-400' },
  medium: { label: '重要', color: 'text-amber-600', dotColor: 'bg-amber-400' },
  high: { label: '严重', color: 'text-orange-600', dotColor: 'bg-orange-500' },
  critical: { label: '紧急', color: 'text-red-600', dotColor: 'bg-red-500' },
};

export const POLICY_STATUS_MAP: Record<PolicyStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '投保中', color: '#64748B', bgColor: 'bg-slate-100 text-slate-700' },
  active: { label: '保障中', color: '#10B981', bgColor: 'bg-emerald-50 text-emerald-700' },
  expired: { label: '已过期', color: '#94A3B8', bgColor: 'bg-slate-50 text-slate-500' },
  claimed: { label: '理赔中', color: '#F59E0B', bgColor: 'bg-amber-50 text-amber-700' },
};

export const PATIENT_TYPE_OPTIONS = Object.entries(PATIENT_TYPE_MAP).map(([key, val]) => ({
  value: key as PatientType,
  label: val.label,
}));

export const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_MAP).map(([key, val]) => ({
  value: key as RiskLevel,
  label: val.label,
}));

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_MAP).map(([key, val]) => ({
  value: key as OrderStatus,
  label: val.label,
}));
