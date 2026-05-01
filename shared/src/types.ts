export interface User {
  id: number;
  username: string;
  passwordHash: string;
  email?: string;
  phone?: string;
  realName?: string;
  roleId: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  module: string;
}

export interface Account {
  id: number;
  userId: number;
  balance: number;
  freezeBalance: number;
  totalUsed: number;
  creditLimit: number;
  balanceWarningThreshold: number;
  autoRechargeEnabled: number;
  autoRechargeAmount: number;
  autoRechargeTriggerAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmsTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  templateContent: string;
  templateType: string;
  signName?: string;
  variables?: any;
  status: number;
  operatorId: number;
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  id: number;
  providerCode: string;
  providerName: string;
  description?: string;
  status: number;
  priority: number;
  config?: any;
  pricePerSms: number;
  supportedTemplateTypes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SendTask {
  id: number;
  taskCode: string;
  taskName: string;
  templateId: number;
  templateContentSnapshot?: string;
  senderId: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  pendingCount: number;
  interceptCount: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmsRecord {
  id: number;
  smsCode: string;
  taskId?: number;
  templateId: number;
  senderId: number;
  providerId?: number;
  phoneNumber: string;
  content: string;
  templateVariables?: any;
  status: number;
  interceptReason?: string;
  failReason?: string;
  price: number;
  amount: number;
  requestId?: string;
  requestAt?: Date;
  receiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FrequencyRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  targetType: string;
  timeWindow: number;
  maxCount: number;
  templateType?: string;
  priority: number;
  status: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterceptRecord {
  id: number;
  interceptCode: string;
  smsRecordId: number;
  interceptType: string;
  interceptReason: string;
  phoneNumber: string;
  templateId?: number;
  contentSnapshot?: string;
  interceptAt: Date;
}

export interface ReceiptRaw {
  id: number;
  rawContent: string;
  providerId: number;
  requestId?: string;
  parsed: number;
  parseError?: string;
  sourceIp?: string;
  receivedAt: Date;
}

export interface ComplianceRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  ruleType: string;
  ruleContent: string;
  action: string;
  replaceText?: string;
  priority: number;
  status: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutingRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  templateType?: string;
  phonePrefix?: string;
  targetProviderId?: number;
  weight: number;
  conditions?: any;
  priority: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: number;
  auditCode: string;
  userId?: number;
  module: string;
  action: string;
  targetType?: string;
  targetId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ConsumptionRecord {
  id: number;
  recordCode: string;
  userId: number;
  smsRecordId: number;
  templateId?: number;
  taskId?: number;
  providerId?: number;
  phoneNumber?: string;
  price: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: number;
  refundReason?: string;
  createdAt: Date;
}

export interface RechargeRecord {
  id: number;
  rechargeCode: string;
  userId: number;
  amount: number;
  paymentMethod?: string;
  paymentTransactionId?: string;
  status: number;
  isAutoRecharge: number;
  balanceBefore?: number;
  balanceAfter?: number;
  paidAt?: Date;
  createdAt: Date;
}

export interface BalanceWarning {
  id: number;
  warningCode: string;
  userId: number;
  currentBalance: number;
  warningThreshold: number;
  warningLevel: number;
  notified: number;
  notifiedAt?: Date;
  autoRechargeTriggered: number;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JwtPayload {
  userId: number;
  username: string;
  roleId: number;
  roleCode: string;
  permissions: string[];
}

export interface RoutingResult {
  providerId: number;
  providerCode: string;
  providerName: string;
  pricePerSms: number;
  matchedRule?: string;
}

export interface FrequencyCheckResult {
  allowed: boolean;
  remainingCount: number;
  windowEnd?: Date;
  interceptReason?: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  issues: {
    ruleCode: string;
    ruleName: string;
    reason: string;
    action: string;
  }[];
  modifiedContent?: string;
}

export interface ReceiptParseResult {
  success: boolean;
  requestId: string;
  phoneNumber?: string;
  status: 'success' | 'failed';
  errorCode?: string;
  errorMessage?: string;
  sendTime?: Date;
  receiveTime?: Date;
}
