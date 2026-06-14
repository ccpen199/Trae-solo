import { get, post, put, del } from '../request';
import type { ApiResponse } from '../request';

export type PlaceStatus = 'pending' | 'approved' | 'rejected' | 'closed';
export type PlaceType = 'internet_cafe' | 'arcade' | 'ktv' | 'other';
export type CertStatus = 'valid' | 'expiring_soon' | 'expired' | 'not_uploaded';
export type RectificationStatus = 'pending' | 'submitted' | 'recheck_passed' | 'recheck_failed';
export type RectificationSource = 'audit_reject' | 'inspection' | 'alarm';
export type AuditAction = 'submit' | 'material_review' | 'site_inspection' | 'approve' | 'reject' | 'revoke' | 'edit' | 'supplement';
export type AuditResult = 'approved' | 'rejected' | 'supplement_required';

export const PLACE_TYPE_MAP: Record<PlaceType, string> = {
  internet_cafe: '网吧',
  arcade: '游戏厅',
  ktv: 'KTV',
  other: '其他',
};

export const PLACE_STATUS_MAP: Record<PlaceStatus, { text: string; status: 'pending' | 'success' | 'danger' | 'default' }> = {
  pending: { text: '待审核', status: 'pending' },
  approved: { text: '已备案', status: 'success' },
  rejected: { text: '已驳回', status: 'danger' },
  closed: { text: '已注销', status: 'default' },
};

export const CERT_STATUS_MAP: Record<CertStatus, { text: string; color: string }> = {
  valid: { text: '有效', color: 'success' },
  expiring_soon: { text: '即将过期', color: 'warning' },
  expired: { text: '已过期', color: 'error' },
  not_uploaded: { text: '未上传', color: 'default' },
};

export const RECTIFICATION_STATUS_MAP: Record<RectificationStatus, { text: string; color: string }> = {
  pending: { text: '待整改', color: 'error' },
  submitted: { text: '已提交', color: 'processing' },
  recheck_passed: { text: '复查通过', color: 'success' },
  recheck_failed: { text: '复查不通过', color: 'warning' },
};

export const RECTIFICATION_SOURCE_MAP: Record<RectificationSource, string> = {
  audit_reject: '审核驳回',
  inspection: '巡检发现',
  alarm: '告警联动',
};

export const AUDIT_ACTION_MAP: Record<AuditAction, { text: string; color: string }> = {
  submit: { text: '提交备案', color: 'blue' },
  material_review: { text: '材料审查', color: 'processing' },
  site_inspection: { text: '现场核查', color: 'cyan' },
  approve: { text: '审核通过', color: 'green' },
  reject: { text: '审核驳回', color: 'red' },
  revoke: { text: '注销备案', color: 'orange' },
  edit: { text: '信息变更', color: 'blue' },
  supplement: { text: '补充材料', color: 'purple' },
};

export interface PlaceCertificate {
  type: 'fire' | 'security' | 'business';
  typeName: string;
  url: string;
  name: string;
}

export interface PlaceCertificateDetail {
  type: 'fire' | 'security' | 'business';
  typeName: string;
  certNo: string;
  issueOrg: string;
  issueDate: string;
  expiryDate: string;
  url: string;
  name: string;
  status: CertStatus;
}

export interface PlaceAuditRecord {
  id: string;
  action: AuditAction;
  actionName: string;
  operator: string;
  remark?: string;
  attachments?: string[];
  result?: AuditResult;
  time: string;
}

export interface RectificationSubmitMaterial {
  photos: string[];
  description: string;
  submitTime: string;
}

export interface RectificationRecheckRecord {
  rechecker: string;
  recheckTime: string;
  result: 'passed' | 'failed';
  opinion: string;
}

export interface PlaceRectificationRecord {
  id: string;
  source: RectificationSource;
  sourceName: string;
  content: string;
  requirement: string;
  deadline: string;
  status: RectificationStatus;
  statusName: string;
  submitMaterial?: RectificationSubmitMaterial;
  recheckRecord?: RectificationRecheckRecord;
  createdAt: string;
}

export interface PlaceChangeRecord {
  id: string;
  field: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  operator: string;
  time: string;
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  typeName: string;
  legalPerson: string;
  phone: string;
  contactPerson: string;
  address: string;
  province: string;
  city: string;
  district: string;
  regionCode: string;
  businessHours: string;
  computerCount: number;
  area: number;
  description: string;
  certificates: PlaceCertificate[];
  certificateDetails: PlaceCertificateDetail[];
  images: string[];
  capacity: number;
  currentCount: number;
  status: PlaceStatus;
  statusName: string;
  auditRecords: PlaceAuditRecord[];
  rectificationRecords: PlaceRectificationRecord[];
  changeRecords: PlaceChangeRecord[];
  fireLicenseStatus: CertStatus;
  securityLicenseStatus: CertStatus;
  lastAuditTime?: string;
  rectificationStatus: 'none' | 'pending' | 'submitted' | 'recheck_passed' | 'recheck_failed';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectReason?: string;
  longitude?: number;
  latitude?: number;
}

export interface PlaceListParams {
  page: number;
  pageSize: number;
  name?: string;
  type?: PlaceType;
  status?: PlaceStatus;
  city?: string;
  district?: string;
  fireLicenseStatus?: CertStatus;
  securityLicenseStatus?: CertStatus;
  rectificationStatus?: string;
}

export interface PlaceListData {
  list: Place[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlaceCreateParams {
  name: string;
  type: PlaceType;
  legalPerson: string;
  phone: string;
  contactPerson: string;
  address: string;
  province: string;
  city: string;
  district: string;
  regionCode: string;
  businessHours: string;
  computerCount: number;
  area: number;
  description: string;
  certificates: PlaceCertificate[];
  certificateDetails: PlaceCertificateDetail[];
  images: string[];
  capacity: number;
  longitude?: number;
  latitude?: number;
}

export interface PlaceReviewParams {
  id: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

export const getPlaceList = (params: PlaceListParams): Promise<ApiResponse<PlaceListData>> => {
  return get<PlaceListData>('/place/list', params);
};

export const getPlaceDetail = (id: string): Promise<ApiResponse<Place>> => {
  return get<Place>(`/place/${id}`);
};

export const createPlace = (params: PlaceCreateParams): Promise<ApiResponse<Place>> => {
  return post<Place>('/place', params);
};

export const updatePlace = (id: string, params: Partial<PlaceCreateParams>): Promise<ApiResponse<Place>> => {
  return put<Place>(`/place/${id}`, params);
};

export const deletePlace = (id: string): Promise<ApiResponse<null>> => {
  return del<null>(`/place/${id}`);
};

export const reviewPlace = (params: PlaceReviewParams): Promise<ApiResponse<Place>> => {
  return post<Place>('/place/review', params);
};

export const revokePlace = (id: string, reason: string): Promise<ApiResponse<Place>> => {
  return post<Place>('/place/revoke', { id, reason });
};

export const getPlaceStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/place/statistics');
};

export const batchReviewPlaces = (ids: string[], status: 'approved' | 'rejected', reason?: string): Promise<ApiResponse<null>> => {
  return post<null>('/place/batch-review', { ids, status, reason });
};

export const batchUrgePlaces = (ids: string[]): Promise<ApiResponse<null>> => {
  return post<null>('/place/batch-urge', { ids });
};

export const recheckRectification = (id: string, result: 'passed' | 'failed', opinion: string): Promise<ApiResponse<null>> => {
  return post<null>(`/place/rectification/recheck`, { id, result, opinion });
};

export function getCertStatus(expiryDate: string | undefined): CertStatus {
  if (!expiryDate) return 'not_uploaded';
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'valid';
}
