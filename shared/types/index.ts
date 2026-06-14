export interface User {
  id: number;
  idCard: string;
  name: string;
  phone: string;
  userType: 'resident' | 'flexible' | 'admin_tax' | 'admin_ops';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface InsuranceInfo {
  id: number;
  userId: number;
  insuranceType: 'pension' | 'medical' | 'flexible_pension' | 'flexible_medical';
  status: 'insured' | 'suspended' | 'terminated';
  payGrade: number;
  totalMonths: number;
  governmentSubsidy: number;
  personalAccount: number;
  insuredAt: string;
}

export interface PaymentOrder {
  id: number;
  orderNo: string;
  userId: number;
  insuranceType: string;
  payYear: number;
  payGrade: number;
  amount: number;
  channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank';
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  taxInvoiceStatus: 'pending' | 'issued' | 'failed';
  financeStatus: 'pending' | 'warehoused' | 'failed';
  medicalCreditStatus: 'pending' | 'credited' | 'failed';
  paidAt: string;
  createdAt: string;
}

export interface FamilyMutualAid {
  id: number;
  userId: number;
  relativeIdCard: string;
  relativeName: string;
  relationship: 'parent' | 'child' | 'spouse';
  authAmount: number;
  usedAmount: number;
  status: 'pending_verify' | 'active' | 'rejected' | 'terminated';
  verifiedAt: string;
  createdAt: string;
}

export interface PensionPayment {
  id: number;
  userId: number;
  payMonth: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  status: 'pending' | 'paid' | 'failed';
  paidAt: string;
}

export interface PaymentWarning {
  id: number;
  userId: number;
  warningType: 'break_pay' | 'abnormal_amount' | 'suspected_fraud';
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: 'pending' | 'processing' | 'resolved' | 'ignored';
  handlerId: number;
  handledAt: string;
  handleNote: string;
  triggeredAt: string;
}

export interface AuditRule {
  id: number;
  ruleName: string;
  ruleCode: string;
  ruleCondition: string;
  riskLevel: 'low' | 'medium' | 'high';
  threshold: number;
  enabled: boolean;
  createdAt: string;
}
