export interface CommunityHealthMetrics {
  tenantId: string;
  date: string;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  topicCount: number;
  topicActiveUsers: number;
  topicCommentCount: number;
  orderCount: number;
  orderTotalAmount: number;
  orderConversionRate: number;
  secondhandOrderCount: number;
  secondhandTotalAmount: number;
  complaintCount: number;
  complaintResolvedCount: number;
  avgFirstResponseMin: number;
  avgResolutionMin: number;
  redpacketGrantedAmount: number;
  redpacketUsedAmount: number;
  partnerSales: number;
  partnerCommission: number;
}

export interface DashboardSummary {
  totalTenants: number;
  totalUsers: number;
  totalOrders: number;
  totalGMV: number;
  todayActiveUsers: number;
  todayNewUsers: number;
  todayTopicCount: number;
  pendingComplaints: number;
  pendingWithdrawals: number;
  redpacketPoolBalance: number;
  escrowBalance: number;
}

export interface TopicTrendItem {
  date: string;
  count: number;
  activeUsers: number;
}

export interface SalesTrendItem {
  date: string;
  orderCount: number;
  totalAmount: number;
  conversionRate: number;
}

export interface ComplaintMetrics {
  totalCount: number;
  pendingCount: number;
  resolvedCount: number;
  avgFirstResponseMin: number;
  avgResolutionMin: number;
  within24hRate: number;
}

export interface RiskAlert {
  id: string;
  type: 'withdraw_limit' | 'aml' | 'suspicious_activity' | 'abnormal_login' | 'sensitive_topic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tenantId?: string;
  userId?: string;
  relatedId?: string;
  title: string;
  description: string;
  data?: Record<string, any>;
  isHandled: boolean;
  handlerId?: string;
  handledAt?: Date;
  handleRemark?: string;
  createdAt: Date;
}

export interface AmlCheckResult {
  passed: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  triggers: string[];
  dailyTotal?: number;
  monthlyTotal?: number;
  relatedTransactions?: string[];
}

export interface DailyWithdrawStats {
  userId: string;
  date: string;
  totalAmount: number;
  count: number;
  limit: number;
}

export interface SensitiveWordHitLog {
  id: string;
  topicId?: string;
  commentId?: string;
  userId: string;
  matchedWords: string[];
  contentSnippet: string;
  riskScore: number;
  isBlocked: boolean;
  reviewedBy?: string;
  reviewResult?: 'allowed' | 'blocked' | 'deleted';
  createdAt: Date;
}
