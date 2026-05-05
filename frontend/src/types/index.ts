export type UserRole = 'admin' | 'enterprise';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type EnterpriseType = 'production' | 'logistics' | 'transfer' | 'receiver';
export type LogisticsStatus = 'created' | 'transit' | 'transferring' | 'delivered' | 'abnormal';
export type LogisticsLink = 'production' | 'initiator' | 'transfer' | 'receiver' | 'unmatched';
export type OperationType = 'create_logistics' | 'upload_logistics' | 'download_logistics' | 'update_profile' | 'approve_enterprise' | 'reject_enterprise' | 'delete_enterprise' | 'delete_log' | 'login' | 'logout';
export type LogisticsCategory = 'production' | 'initiator' | 'transfer' | 'receiver' | 'unmatched';

export interface Enterprise {
  id: string;
  enterpriseCode: string;
  enterpriseName: string;
  enterpriseType: EnterpriseType;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  enterpriseId: string | null;
  enterprise: Enterprise | null;
  status: UserStatus;
  realName?: string;
  phone?: string;
  email?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsOrder {
  id: string;
  logisticsNo: string;
  proxyNo?: string;
  productionEnterpriseId: string | null;
  productionEnterpriseCode?: string;
  productionEnterpriseName?: string;
  initiatorEnterpriseId: string | null;
  initiatorEnterpriseCode?: string;
  initiatorEnterpriseName?: string;
  transferEnterpriseId: string | null;
  transferEnterpriseCode?: string;
  transferEnterpriseName?: string;
  receiverEnterpriseId: string | null;
  receiverEnterpriseCode?: string;
  receiverEnterpriseName?: string;
  goodsName: string;
  quantity?: number;
  unit?: string;
  weight?: number;
  volume?: number;
  shipmentDate?: string;
  expectedDeliveryDate?: string;
  shipmentAddress?: string;
  deliveryAddress?: string;
  status: LogisticsStatus;
  currentLink: LogisticsLink;
  remark?: string;
  isUnmatched: boolean;
  createdByEnterpriseId: string | null;
  createdByEnterpriseCode?: string;
  createdByUserId: string | null;
  sourceType?: string;
  unmatchedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  operationType: OperationType;
  operationDesc: string;
  userId: string | null;
  username?: string;
  enterpriseId: string | null;
  enterpriseCode?: string;
  enterpriseName?: string;
  requestParams?: string;
  requestUrl?: string;
  requestMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const enterpriseTypeMap: Record<EnterpriseType, string> = {
  production: '生产企业',
  logistics: '物流企业',
  transfer: '中转企业',
  receiver: '接收企业',
};

export const userStatusMap: Record<UserStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export const logisticsStatusMap: Record<LogisticsStatus, string> = {
  created: '已创建',
  transit: '运输中',
  transferring: '中转中',
  delivered: '已送达',
  abnormal: '异常',
};

export const logisticsLinkMap: Record<LogisticsLink, string> = {
  production: '生产环节',
  initiator: '发起环节',
  transfer: '中转环节',
  receiver: '接收环节',
  unmatched: '未匹配',
};

export const operationTypeMap: Record<OperationType, string> = {
  create_logistics: '新增物流单',
  upload_logistics: '上传物流单',
  download_logistics: '下载物流单',
  update_profile: '修改个人信息',
  approve_enterprise: '审核通过企业',
  reject_enterprise: '拒绝企业',
  delete_enterprise: '删除企业',
  delete_log: '删除日志',
  login: '登录',
  logout: '退出',
};

export const logisticsCategoryMap: Record<LogisticsCategory, string> = {
  production: '生产企业物流单',
  initiator: '发起企业物流单',
  transfer: '中转企业物流单',
  receiver: '接收企业物流单',
  unmatched: '异常数据',
};
