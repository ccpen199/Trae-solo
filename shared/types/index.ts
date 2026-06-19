export type CouponType = 'fixed' | 'discount' | 'threshold';
export type CouponStatus = 'draft' | 'active' | 'paused' | 'expired';
export type PauseReason = 'system_maintenance' | 'risk_control' | 'inventory_adjustment' | 'policy_adjustment' | 'other';
export type CouponInstanceStatus = 'available' | 'used' | 'expired' | 'frozen';
export type DistributionStrategyType = 'targeted' | 'geofencing' | 'auto';
export type TerminalType = 'pos' | 'miniapp' | 'citycode';
export type VerificationStatus = 'success' | 'failed' | 'reversed';
export type RiskEventType = 'multi_account' | 'bulk_hoarding' | 'abnormal_path';
export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskStatus = 'pending' | 'reviewing' | 'resolved' | 'ignored';
export type UserStatus = 'normal' | 'frozen' | 'watch';
export type ConsumptionTier = 'low' | 'medium' | 'high';
export type SettlementStatus = 'pending' | 'approved' | 'rejected' | 'transferred';
export type AlertType = 'inventory' | 'verification_rate' | 'risk' | 'system';
export type AlertLevel = 'info' | 'warning' | 'critical';
export type UserRole = 'admin' | 'merchant' | 'cashier' | 'risk_officer';

export type ReplenishmentStatus = 'pending' | 'approved' | 'completed' | 'cancelled';
export type ReconciliationStatus = 'reconciled' | 'pending' | 'reconciling' | 'abnormal';
export type InventoryAlertType = 'low_stock' | 'expiring_soon' | 'abnormal_consumption';
export type InventoryAlertLevel = 'normal' | 'attention' | 'warning' | 'critical';
export type InventoryAlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored';
export type InventoryLogDetailType = 'receive_in' | 'verify_out' | 'adjust' | 'expire_loss' | 'system_adjust';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface GeofenceArea {
  id: string;
  name: string;
  type: 'circle' | 'polygon' | 'district';
  center?: GeoLocation;
  radius?: number;
  coordinates?: GeoLocation[];
  districtCode?: string;
}

export interface AutoTriggerCondition {
  minConsumptionAmount: number;
  category?: string;
  merchantIds?: string[];
  maxCouponsPerUser: number;
}

export interface DistributionStrategy {
  id: string;
  type: DistributionStrategyType;
  targetedGroups?: string[];
  geofencingAreas?: GeofenceArea[];
  autoTriggerConditions?: AutoTriggerCondition;
}

export interface StatusChangeRecord {
  id: string;
  fromStatus: CouponStatus;
  toStatus: CouponStatus;
  reason: string;
  remark?: string;
  operatorId: string;
  operatorName: string;
  createdAt: Date;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  approvedAt?: Date;
}

export interface CouponActivity {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  threshold: number;
  totalQuantity: number;
  usedQuantity: number;
  status: CouponStatus;
  startTime: Date;
  endTime: Date;
  distributionStrategy?: DistributionStrategy;
  applicableMerchants: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  pauseReason?: PauseReason;
  pausedAt?: Date;
  pausedBy?: string;
  pausedByName?: string;
  pauseRemark?: string;
  expectedResumeTime?: Date;
  notifyMerchants?: boolean;
  statusHistory?: StatusChangeRecord[];
  resumePendingApproval?: boolean;
}

export interface CouponInstance {
  id: string;
  activityId: string;
  userId: string;
  code: string;
  status: CouponInstanceStatus;
  issuedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  activity?: CouponActivity;
}

export interface Merchant {
  id: string;
  name: string;
  licenseNo: string;
  contactName: string;
  contactPhone: string;
  address: string;
  district: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

export interface Store {
  id: string;
  merchantId: string;
  name: string;
  address: string;
  district: string;
  location: GeoLocation;
  status: 'active' | 'inactive';
}

export interface POSTerminal {
  id: string;
  storeId: string;
  merchantId: string;
  terminalNo: string;
  model: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastHeartbeat?: Date;
}

export interface VerificationRecord {
  id: string;
  couponInstanceId: string;
  activityId: string;
  userId: string;
  merchantId: string;
  storeId?: string;
  terminalId?: string;
  terminalType: TerminalType;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  status: VerificationStatus;
  verifiedAt: Date;
  location?: GeoLocation;
  orderNo?: string;
  couponInstance?: CouponInstance;
  merchant?: Merchant;
}

export interface User {
  id: string;
  realName: string;
  idCard: string;
  phone: string;
  deviceId?: string;
  riskScore: number;
  status: UserStatus;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  consumptionTier: ConsumptionTier;
  preferredCategories: string[];
  preferredDistricts: string[];
  historicalVerificationCount: number;
  historicalVerificationAmount: number;
  lastActiveAt?: Date;
}

export interface RiskEvidence {
  deviceId?: string;
  accountCount?: number;
  timeWindow?: string;
  couponCount?: number;
  pathNodes?: string[];
  ipAddresses?: string[];
  timestamps?: Date[];
  anomalyScore: number;
}

export interface RiskEvent {
  id: string;
  type: RiskEventType;
  level: RiskLevel;
  userId?: string;
  deviceId?: string;
  relatedAccounts?: string[];
  evidence: RiskEvidence;
  status: RiskStatus;
  handlerId?: string;
  handledAt?: Date;
  handlerNotes?: string;
  detectedAt: Date;
}

export interface Inventory {
  id: string;
  activityId: string;
  batchNo: string;
  quantity: number;
  availableQuantity: number;
  unitCost?: number;
  expiryDate?: Date;
  createdAt: Date;
  activity?: CouponActivity;
}

export interface InventoryLog {
  id: string;
  inventoryId: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  balance: number;
  operatorId: string;
  operatorName: string;
  remark?: string;
  createdAt: Date;
}

export interface SettlementRecord {
  id: string;
  merchantId: string;
  periodStart: Date;
  periodEnd: Date;
  totalVerifications: number;
  totalAmount: number;
  subsidyAmount: number;
  actualAmount: number;
  status: SettlementStatus;
  provincialBatchId?: string;
  transferTime?: Date;
  createdAt: Date;
  merchant?: Merchant;
}

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  relatedId?: string;
  merchantId?: string;
  read: boolean;
  createdAt: Date;
}

export interface RecommendedCoupon {
  activityId: string;
  activity: CouponActivity;
  score: number;
  reason: string;
  matchType: 'category' | 'district' | 'tier' | 'trending';
}

export interface VerificationTrendData {
  date: string;
  count: number;
  amount: number;
  discountAmount: number;
}

export interface DashboardStats {
  totalCoupons: number;
  usedCoupons: number;
  verificationRate: number;
  totalAmount: number;
  totalSubsidy: number;
  activeActivities: number;
  activeMerchants: number;
  todayVerifications: number;
  todayAmount: number;
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  merchantId?: string;
  name: string;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProvincialSettlementRecord {
  id: string;
  batchId: string;
  cityCode: string;
  totalAmount: number;
  subsidyAmount: number;
  merchantCount: number;
  status: 'pending' | 'synced' | 'confirmed' | 'paid';
  syncTime?: Date;
  confirmTime?: Date;
  paidTime?: Date;
  createdAt: Date;
}

export interface ProvincialPlatformConfig {
  apiUrl: string;
  appId: string;
  cityCode: string;
  publicKey: string;
  enabled: boolean;
}

export interface VerificationSourceDistribution {
  pos: number;
  miniapp: number;
  citycode: number;
}

export interface InventoryTrendData {
  date: string;
  quantity: number;
  inQuantity: number;
  outQuantity: number;
}

export interface ReplenishmentRecord {
  id: string;
  inventoryId: string;
  batchNo: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  status: ReplenishmentStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: Date;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReconciliationRecord {
  id: string;
  inventoryId: string;
  batchNo: string;
  periodStart: Date;
  periodEnd: Date;
  status: ReconciliationStatus;
  expectedQuantity: number;
  actualQuantity: number;
  diffQuantity: number;
  diffAmount: number;
  lastReconciledAt?: Date;
  reconciledBy?: string;
  remark?: string;
  createdAt: Date;
}

export interface InventoryAlert {
  id: string;
  inventoryId: string;
  batchNo: string;
  type: InventoryAlertType;
  level: InventoryAlertLevel;
  title: string;
  message: string;
  status: InventoryAlertStatus;
  threshold?: number;
  currentValue?: number;
  handlerId?: string;
  handlerName?: string;
  handledAt?: Date;
  handlerNotes?: string;
  createdAt: Date;
}

export interface InventoryLog {
  id: string;
  inventoryId: string;
  type: 'in' | 'out' | 'adjust';
  detailType: InventoryLogDetailType;
  quantity: number;
  balance: number;
  sourceTerminal?: TerminalType;
  relatedOrderNo?: string;
  operatorId: string;
  operatorName: string;
  operatorRole?: UserRole;
  remark?: string;
  createdAt: Date;
}
