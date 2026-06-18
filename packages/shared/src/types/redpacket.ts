export type RedPacketSource =
  | 'sign_in'
  | 'invite'
  | 'review'
  | 'task'
  | 'activity'
  | 'partner_commission'
  | 'refund'
  | 'admin_grant';

export type RedPacketStatus = 'unused' | 'used' | 'expired' | 'locked';

export type WithdrawStatus = 'pending' | 'processing' | 'success' | 'failed' | 'rejected';

export interface RedPacket {
  id: string;
  userId: string;
  tenantId: string;
  source: RedPacketSource;
  sourceId?: string;
  amount: number;
  remainingAmount: number;
  minOrderAmount?: number;
  status: RedPacketStatus;
  expireAt?: Date;
  usedAt?: Date;
  usedOrderId?: string;
  description?: string;
  createdAt: Date;
}

export interface UserWallet {
  id: string;
  userId: string;
  tenantId: string;
  balance: number;
  frozenAmount: number;
  totalIncome: number;
  totalWithdraw: number;
  totalRedPacket: number;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: 'income' | 'expense' | 'freeze' | 'unfreeze';
  source: RedPacketSource | 'withdraw' | 'payment' | 'refund' | 'adjust';
  sourceId?: string;
  description: string;
  createdAt: Date;
}

export interface WithdrawRecord {
  id: string;
  userId: string;
  walletId: string;
  tenantId: string;
  amount: number;
  fee: number;
  actualAmount: number;
  status: WithdrawStatus;
  paymentMethod: 'wechat' | 'alipay' | 'bank';
  paymentAccount: string;
  paymentAccountName?: string;
  bankName?: string;
  transactionId?: string;
  auditorId?: string;
  auditRemark?: string;
  auditedAt?: Date;
  completedAt?: Date;
  rejectReason?: string;
  riskFlag?: boolean;
  riskReason?: string;
  amlCheckPassed?: boolean;
  createdAt: Date;
}

export type TaskType = 'sign_in' | 'invite_friend' | 'write_review' | 'share_topic' | 'complete_order';

export interface TaskDefinition {
  id: string;
  tenantId?: string;
  taskType: TaskType;
  name: string;
  description: string;
  rewardAmount: number;
  rewardType: 'redpacket' | 'balance';
  maxDailyCount?: number;
  maxTotalCount?: number;
  startAt?: Date;
  endAt?: Date;
  isActive: boolean;
  conditions?: Record<string, any>;
}

export interface UserTaskRecord {
  id: string;
  userId: string;
  taskId: string;
  taskType: TaskType;
  completed: boolean;
  completedAt?: Date;
  rewardGranted: boolean;
  rewardGrantedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SignInRecord {
  id: string;
  userId: string;
  tenantId: string;
  signInDate: string;
  continuousDays: number;
  rewardAmount: number;
  createdAt: Date;
}

export interface InviteRecord {
  id: string;
  inviterId: string;
  inviteeId: string;
  tenantId: string;
  rewardAmount: number;
  rewardGranted: boolean;
  rewardGrantedAt?: Date;
  createdAt: Date;
}
