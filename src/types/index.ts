export interface User {
  id: string;
  name: string;
  role: "province_admin" | "city_admin" | "base_admin" | "member";
  orgId: string;
  orgName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface OrgNode {
  id: string;
  name: string;
  level: "province" | "city" | "base";
  parentId: string | null;
  memberCount: number;
  children: OrgNode[];
}

export interface Member {
  id: string;
  name: string;
  idCard: string;
  employeeNo: string;
  orgId: string;
  orgName: string;
  status: "pending" | "active" | "rejected";
  joinDate: string;
  points: number;
  tags: string[];
}

export interface MemberAudit {
  id: string;
  action: "approve" | "reject" | "verify" | "sync_add" | "sync_update" | "sync_conflict";
  actionLabel: string;
  source: "national_db" | "manual" | "auto_sync";
  sourceLabel: string;
  operatorName: string | null;
  reason: string | null;
  createdAt: string;
}

export interface VerifyResult {
  matchedORG: string;
  orgId: string;
  memberStatus: string;
  matchConfidence: number;
  suggestedReviewer: string;
  suggestedReviewerOrg: string;
}

export interface MemberVerifyRequest {
  idCard: string;
  employeeNo: string;
  name: string;
  phone: string;
}

export interface VoucherTemplate {
  id: string;
  name: string;
  amount: number;
  totalQuantity: number;
  remainingQuantity: number;
  expiryDate: string;
  status: "draft" | "active" | "expired";
  budgetId?: string;
}

export interface Voucher {
  id: string;
  templateId: string;
  templateName?: string;
  amount?: number;
  code: string;
  memberId: string;
  status: "unused" | "used" | "expired";
  issuedAt: string;
  usedAt?: string;
  expiryDate?: string;
  serialNo?: string;
  operatorName?: string;
}

export interface PointsProduct {
  id: string;
  name: string;
  points: number;
  image: string;
  stock: number;
  category: string;
}

export interface PointsOrder {
  id: string;
  memberId: string;
  productId: string;
  status: "pending" | "shipped" | "completed" | "cancelled";
  createdAt: string;
}

export interface BudgetPlan {
  id: string;
  orgId: string;
  title: string;
  totalAmount: number;
  usedAmount: number;
  status: "pending" | "approved" | "rejected" | "executing" | "completed";
  approvalFlow: ApprovalStep[];
}

export interface ApprovalStep {
  step: number;
  approver: string;
  approverName: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  timestamp?: string;
}

export interface VipLoungeBooking {
  id: string;
  memberId: string;
  loungeId: string;
  loungeName: string;
  bookingDate: string;
  bookingTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

export interface TrainTicketRequest {
  id: string;
  memberId: string;
  fromStation: string;
  toStation: string;
  travelDate: string;
  status: "pending" | "approved" | "rejected" | "purchased";
}

export interface HealthCheckupPackage {
  id: string;
  providerName: string;
  name: string;
  originalPrice: number;
  groupPrice: number;
  items: string[];
  enrolledCount: number;
  maxCount: number;
}

export interface LegalConsultBooking {
  id: string;
  memberId: string;
  lawyerId: string;
  lawyerName: string;
  bookingDate: string;
  bookingTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

export type Booking =
  | { type: "vip_lounge"; data: VipLoungeBooking }
  | { type: "train_ticket"; data: TrainTicketRequest }
  | { type: "health_checkup"; data: HealthCheckupPackage }
  | { type: "legal_consult"; data: LegalConsultBooking };

export interface Supplier {
  id: string;
  name: string;
  category: string;
  status: "applying" | "approved" | "suspended" | "blacklisted";
  qualificationDocs: string[];
  score: number;
  assessmentHistory: SupplierAssessment[];
}

export interface SupplierAssessment {
  id: string;
  supplierId: string;
  score: number;
  comment: string;
  assessor: string;
  date: string;
}

export interface FunnelData {
  stage: string;
  count: number;
  rate: number;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  benefitCoverageRate: number;
}

export interface RecommendationRule {
  id: string;
  name: string;
  conditions: {
    tags: string[];
    ageRange?: [number, number];
    jobTitle?: string;
  };
  benefitIds: string[];
  priority: number;
  enabled: boolean;
}

export interface LinkedTemplate {
  id: string;
  name: string;
  amount: number;
  totalQuantity: number;
  remainingQuantity: number;
  expiryDate: string;
  status: "draft" | "active" | "expired";
}

export interface VoucherBreakdown {
  templateId: string;
  name: string;
  issued: number;
  used: number;
  amountPerUnit: number;
  totalUsedAmount: number;
}

export interface RedeemedVoucher {
  id: string;
  code: string;
  memberId: string;
  memberName: string;
  memberOrgName: string;
  usedAt: string;
  amount: number;
  templateName: string;
  serialNo: string;
  operatorName: string;
}

export interface BudgetDetail extends BudgetPlan {
  linkedTemplates: LinkedTemplate[];
  issuedCount: number;
  usedCount: number;
  issuedAmount: number;
  usedAmount: number;
  remainingBudget: number;
  voucherBreakdown: VoucherBreakdown[];
  redeemedVouchers: RedeemedVoucher[];
}
