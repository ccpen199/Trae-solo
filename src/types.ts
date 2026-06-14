export type TaskType =
  | "steps"
  | "video"
  | "checkin"
  | "invite"
  | "limited"
  | "holiday";

export type TaskStatus =
  | "available"
  | "in_progress"
  | "completed"
  | "expired";

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  coinReward: number;
  progress: number;
  target: number;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  region?: string[];
  tag?: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  coinBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  checkinDays: number;
  inviteCode: string;
  inviterId?: string;
  level: number;
  riskLabel: "normal" | "suspected" | "blocked";
  ltvScore: number;
  deviceFingerprint: string;
  createdAt: string;
  lastCheckin?: string;
}

export interface StepData {
  today: number;
  target: number;
  weekData: number[];
  coinConversion: { steps: number; coins: number }[];
}

export interface WalletInfo {
  coinBalance: number;
  cashEquivalent: number;
  exchangeTiers: { minCoins: number; rate: number; label: string }[];
}

export type TransactionType = "earn" | "withdraw" | "commission";
export type TransactionStatus =
  | "success"
  | "pending"
  | "failed"
  | "intercepted";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  status: TransactionStatus;
}

export interface InviteRelation {
  userId: string;
  nickname: string;
  avatar: string;
  level: 1 | 2;
  commission: number;
  completedTasks: number;
  createdAt: string;
}

export type RiskType =
  | "device_fingerprint"
  | "behavior_sequence"
  | "ip_frequency"
  | "withdrawal_anomaly";
export type RiskSeverity = "low" | "medium" | "high";

export interface RiskAlert {
  id: string;
  userId: string;
  nickname: string;
  type: RiskType;
  severity: RiskSeverity;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface WithdrawalRule {
  id: string;
  name: string;
  condition: string;
  action: "block" | "review" | "limit";
  enabled: boolean;
  hitCount: number;
}

export interface DashboardMetrics {
  dau: number;
  dauTrend: { date: string; value: number }[];
  newUsers: number;
  coinIssued: number;
  withdrawalAmount: number;
  taskROI: {
    taskId: string;
    taskName: string;
    costPerUser: number;
    retention7d: number;
    conversionRate: number;
  }[];
  ltvDistribution: {
    segment: string;
    avgLtv: number;
    userCount: number;
  }[];
  adRevenue: { date: string; revenue: number; ecpm: number }[];
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  tag: string;
}

export interface VideoItem {
  id: string;
  title: string;
  cover: string;
  duration: number;
  coinReward: number;
  watched: boolean;
}
