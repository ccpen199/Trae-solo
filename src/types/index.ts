export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string;
  userType: 1 | 2;
  realNameStatus: 0 | 1 | 2;
  realName?: string;
  idCard?: string;
  companyName?: string;
  createTime: string;
}

export interface Household {
  id: number;
  userId: number;
  householdNo: string;
  householdName: string;
  serviceType: 'water' | 'electricity' | 'gas';
  address: string;
  areaCode: string;
  areaName: string;
  isDefault: number;
  createTime: string;
  arrearsAmount?: number;
}

export interface Bill {
  id: number;
  billNo: string;
  householdId: number;
  householdNo: string;
  householdName: string;
  serviceType: 'water' | 'electricity' | 'gas';
  billingPeriod: string;
  totalAmount: number;
  payableAmount: number;
  paidAmount: number;
  status: 0 | 1 | 2 | 3;
  billDate: string;
  dueDate: string;
  details: BillDetail[];
  paymentTime?: string;
}

export interface BillDetail {
  itemName: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
}

export interface PaymentRecord {
  id: number;
  paymentNo: string;
  userId: number;
  billIds: number[];
  householdNos: string[];
  serviceTypes: string[];
  totalAmount: number;
  payMethod: string;
  status: 0 | 1 | 2 | 3;
  payTime?: string;
  thirdPartyNo?: string;
  createTime: string;
}

export interface Voucher {
  id: number;
  voucherNo: string;
  paymentId: number;
  paymentNo: string;
  amount: number;
  fileUrl: string;
  createTime: string;
}

export interface Announcement {
  id: number;
  title: string;
  type: 'outage' | 'repair' | 'notice';
  serviceType: 'water' | 'electricity' | 'gas' | 'all';
  summary: string;
  content: string;
  affectAreas: string[];
  affectAreaNames: string[];
  status: 0 | 1 | 2 | 3 | 4;
  creatorName: string;
  publishTime?: string;
  createTime: string;
}

export interface WorkOrder {
  id: number;
  orderNo: string;
  userId: number;
  userName: string;
  userPhone: string;
  type: string;
  title: string;
  content: string;
  images?: string[];
  status: 0 | 1 | 2 | 3 | 4;
  priority: 0 | 1 | 2;
  assigneeId?: number;
  assigneeName?: string;
  createTime: string;
  updateTime: string;
}

export interface WorkOrderLog {
  id: number;
  orderId: number;
  action: string;
  content: string;
  operatorId?: number;
  operatorName?: string;
  createTime: string;
}

export interface ServiceOutlet {
  id: number;
  name: string;
  address: string;
  lng: number;
  lat: number;
  businessHours: string;
  serviceScope: string;
  contactPhone: string;
  services: string[];
}

export interface QueueStatus {
  outletId: number;
  outletName: string;
  waitingCount: number;
  processingCount: number;
  avgWaitTime: number;
  updateTime: string;
}

export interface AdminUser {
  id: number;
  username: string;
  realName: string;
  roleId: number;
  roleName: string;
  status: 0 | 1;
  createTime: string;
}

export interface Role {
  id: number;
  roleName: string;
  description: string;
  permissionIds: number[];
  createTime: string;
}

export interface Permission {
  id: number;
  permissionKey: string;
  permissionName: string;
  type: 'menu' | 'button' | 'api';
  parentId: number;
  icon?: string;
  sort: number;
}

export interface PaymentStatistics {
  totalAmount: number;
  totalCount: number;
  waterAmount: number;
  waterCount: number;
  electricityAmount: number;
  electricityCount: number;
  gasAmount: number;
  gasCount: number;
  todayAmount: number;
  todayCount: number;
  dailyTrend: DailyTrendItem[];
  typeRatio: TypeRatioItem[];
}

export interface DailyTrendItem {
  date: string;
  amount: number;
  count: number;
}

export interface TypeRatioItem {
  type: string;
  typeName: string;
  amount: number;
  count: number;
  ratio: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}
