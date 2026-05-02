export type AssetStatus = 
  | 'PENDING_REGISTER'
  | 'PENDING_RECEIVE'
  | 'PENDING_DEPRECIATION'
  | 'PENDING_INVENTORY'
  | 'PENDING_TRANSFER'
  | 'PENDING_SCRAP'
  | 'IN_USE'
  | 'IN_DEPRECIATION'
  | 'TRANSFERRED'
  | 'SCRAPPED'
  | 'REJECTED'
  | 'CANCELLED';

export type UserRole = 
  | 'ASSET_ADMIN'
  | 'DEPARTMENT_USER'
  | 'FINANCE'
  | 'AUDIT'
  | 'MAINTENANCE';

export const AssetStatusLabels: Record<AssetStatus, string> = {
  'PENDING_REGISTER': '待入账',
  'PENDING_RECEIVE': '待领用',
  'PENDING_DEPRECIATION': '待折旧',
  'PENDING_INVENTORY': '待盘点',
  'PENDING_TRANSFER': '待调拨',
  'PENDING_SCRAP': '待报废',
  'IN_USE': '使用中',
  'IN_DEPRECIATION': '折旧中',
  'TRANSFERRED': '已调拨',
  'SCRAPPED': '已报废',
  'REJECTED': '已驳回',
  'CANCELLED': '已取消'
};

export const UserRoleLabels: Record<UserRole, string> = {
  'ASSET_ADMIN': '资产管理员',
  'DEPARTMENT_USER': '使用部门',
  'FINANCE': '财务',
  'AUDIT': '审计',
  'MAINTENANCE': '维修'
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface AssetMaster {
  id: string;
  masterNo: string;
  status: AssetStatus;
  currentHandlerId: string;
  currentHandlerRole: UserRole;
  expectedCompleteTime: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  createdByName?: string;
  handlerName?: string;
  detailCount?: number;
  totalAmount?: number;
}

export interface AssetDetail {
  id: string;
  masterId: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string;
  supplier: string;
  location: string;
  department: string;
  managerId: string;
  useLife: number;
  residualValueRate: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'SUM_OF_YEARS_DIGITS';
  qrCodeId: string;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  managerName?: string;
}

export interface TimelineRecord {
  id: string;
  masterId: string;
  assetDetailId: string;
  userId: string;
  userName: string;
  action: string;
  status: AssetStatus;
  approvalAction: string;
  remarks: string;
  attachments: string;
  createdAt: string;
}

export interface Message {
  id: string;
  masterId: string;
  userId: string;
  title: string;
  content: string;
  type: 'TODO' | 'NOTIFICATION' | 'ALERT';
  status: 'UNREAD' | 'READ' | 'COMPLETED';
  relatedType: string;
  createdAt: string;
}

export interface DashboardData {
  summary: {
    totalAssets: number;
    totalValue: number;
  };
  statusCounts: { status: string; count: number }[];
  departmentCounts: { department: string; count: number; totalValue: number }[];
  typeCounts: { assetType: string; count: number; totalValue: number }[];
  recentAssets: Array<{
    id: string;
    assetCode: string;
    assetName: string;
    assetType: string;
    totalPrice: number;
    status: AssetStatus;
    createdAt: string;
    masterNo: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    totalValue: number;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  warnings?: string[];
}
