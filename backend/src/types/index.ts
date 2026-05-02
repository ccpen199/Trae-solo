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

export type ApprovalAction = 
  | 'APPROVE'
  | 'REJECT'
  | 'SUPPLEMENT'
  | 'REASSIGN';

export type DepreciationMethod = 
  | 'STRAIGHT_LINE'
  | 'DECLINING_BALANCE'
  | 'SUM_OF_YEARS_DIGITS';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department: string;
  createdAt: string;
  updatedAt: string;
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
  depreciationMethod: DepreciationMethod;
  qrCodeId: string;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QRCode {
  id: string;
  assetDetailId: string;
  qrCode: string;
  qrContent: string;
  generatedAt: string;
  scannedCount: number;
  lastScannedAt: string;
  createdAt: string;
}

export interface DepreciationRecord {
  id: string;
  assetDetailId: string;
  period: string;
  originalValue: number;
  accumulatedDepreciation: number;
  netValue: number;
  depreciationAmount: number;
  depreciationMethod: DepreciationMethod;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
}

export interface InventoryRecord {
  id: string;
  masterId: string;
  assetDetailId: string;
  inventoryDate: string;
  inventoryResult: 'NORMAL' | 'MISSING' | 'DAMAGED' | 'TRANSFERRED';
  inventoryBy: string;
  qrScanned: boolean;
  actualQuantity: number;
  systemQuantity: number;
  difference: number;
  remarks: string;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
}

export interface TransferRecord {
  id: string;
  masterId: string;
  assetDetailId: string;
  fromDepartment: string;
  fromManagerId: string;
  toDepartment: string;
  toManagerId: string;
  transferReason: string;
  transferDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
  lockVersion: number;
}

export interface ScrapRecord {
  id: string;
  masterId: string;
  assetDetailId: string;
  scrapReason: string;
  scrapDate: string;
  scrapValue: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: string;
  approvedAt: string;
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
  relatedType: 'REGISTER' | 'RECEIVE' | 'DEPRECIATION' | 'INVENTORY' | 'TRANSFER' | 'SCRAP';
  createdAt: string;
}

export interface OperationLog {
  id: string;
  masterId: string;
  assetDetailId: string;
  userId: string;
  action: string;
  previousStatus: AssetStatus;
  newStatus: AssetStatus;
  remarks: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface TimelineRecord {
  id: string;
  masterId: string;
  assetDetailId: string;
  userId: string;
  userName: string;
  action: string;
  status: AssetStatus;
  approvalAction: ApprovalAction;
  remarks: string;
  attachments: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  masterId: string;
  assetDetailId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}
