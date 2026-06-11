export type ExceptionType = 
  | 'damaged'
  | 'rejected'
  | 'wrong_delivery'
  | 'lost'
  | 'delayed'
  | 'address_unknown'
  | 'recipient_missing'
  | 'refused_pay'
  | 'package_leak'
  | 'other';

export type ExceptionStatus = 
  | 'reported'
  | 'processing'
  | 'resolved'
  | 'closed';

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ExceptionPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  uploadTime: number;
  location?: string;
  longitude?: number;
  latitude?: number;
}

export interface ExceptionRecord {
  id: string;
  waybillNo: string;
  exceptionType: ExceptionType;
  exceptionSubType?: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  description: string;
  photos: ExceptionPhoto[];
  reporterId: string;
  reporterName: string;
  reportTime: number;
  reportLocation?: string;
  reportLongitude?: number;
  reportLatitude?: number;
  handlerId?: string;
  handlerName?: string;
  handleTime?: number;
  handleResult?: string;
  handleRemark?: string;
  compensateAmount?: number;
  customerFeedback?: string;
  isOvertime?: boolean;
  deadline?: number;
  operationLogs: {
    id: string;
    operator: string;
    action: string;
    remark?: string;
    timestamp: number;
  }[];
}

export const EXCEPTION_TYPE_MAP: Record<ExceptionType, string> = {
  damaged: '包装破损',
  rejected: '客户拒收',
  wrong_delivery: '错派件',
  lost: '快件丢失',
  delayed: '时效延误',
  address_unknown: '地址不详',
  recipient_missing: '收件人不在',
  refused_pay: '拒付运费',
  package_leak: '内件泄漏',
  other: '其他异常'
};

export const EXCEPTION_STATUS_MAP: Record<ExceptionStatus, string> = {
  reported: '已上报',
  processing: '处理中',
  resolved: '已解决',
  closed: '已结案'
};

export const EXCEPTION_SEVERITY_MAP: Record<ExceptionSeverity, string> = {
  low: '一般',
  medium: '较严重',
  high: '严重',
  critical: '重大'
};

export interface ExceptionReasonOption {
  type: ExceptionType;
  label: string;
  needPhotos: boolean;
  needDescription: boolean;
  severity: ExceptionSeverity;
}

export const EXCEPTION_REASON_OPTIONS: ExceptionReasonOption[] = [
  { type: 'damaged', label: '包装破损', needPhotos: true, needDescription: true, severity: 'high' },
  { type: 'rejected', label: '客户拒收', needPhotos: false, needDescription: true, severity: 'medium' },
  { type: 'wrong_delivery', label: '错派件', needPhotos: false, needDescription: true, severity: 'medium' },
  { type: 'lost', label: '快件丢失', needPhotos: false, needDescription: true, severity: 'critical' },
  { type: 'delayed', label: '时效延误', needPhotos: false, needDescription: true, severity: 'medium' },
  { type: 'address_unknown', label: '地址不详', needPhotos: false, needDescription: true, severity: 'low' },
  { type: 'recipient_missing', label: '收件人不在', needPhotos: false, needDescription: false, severity: 'low' },
  { type: 'refused_pay', label: '拒付运费', needPhotos: false, needDescription: true, severity: 'medium' },
  { type: 'package_leak', label: '内件泄漏', needPhotos: true, needDescription: true, severity: 'high' },
  { type: 'other', label: '其他异常', needPhotos: true, needDescription: true, severity: 'medium' }
];
