export type UserRole = 'player' | 'booster' | 'admin' | 'reviewer';
export type GameCode = 'LOL' | 'VALORANT' | 'CSGO' | 'DOTA2' | 'OW' | 'Apex';
export type TierRank = 'Iron' | 'Bronze' | 'Silver' | 'Silver' | 'Silver' | 'Gold' | 'Platinum' | 'Emerald' | 'Diamond' | 'Master' | 'Grandmaster' | 'Challenger';
export type CertLevel = 'None' | 'Silver' | 'Gold' | 'Diamond';
export type OrderStatus = 'Pending' | 'Matched' | 'InProgress' | 'Checking' | 'Completed' | 'Disputed' | 'Refunded' | 'Cancelled';
export type DisputeStatus = 'Submitted' | 'EvidenceGathering' | 'Reviewing' | 'Resolved' | 'Appealed';
export type DisputeSide = 'plaintiff' | 'defendant' | 'split';
export type MilestoneType = 'GameStart' | 'Win' | 'RankUp' | 'TierComplete' | 'AllComplete' | 'Checkpoint';
export type EvidenceType = 'ScreenRecording' | 'Screenshot' | 'SDKLog' | 'ManualUpload';
export type ServiceType = 'Ranked' | 'Placement' | 'Coaching' | 'HeroMastery' | 'WinBoost';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  nickname: string;
  avatar: string;
  realNameVerified: boolean;
  createdAt: string;
}

export interface GameAccount {
  id: string;
  userId: string;
  gameCode: GameCode;
  gameUid: string;
  currentTier: TierRank;
  tierScreenshot: string;
  verifiedAt: string;
  verified: boolean;
}

export interface ProviderProfile {
  userId: string;
  certLevel: CertLevel;
  reputationScore: number;
  totalOrders: number;
  completionRate: number;
  onTimeRate: number;
  disputeWinRate: number;
  joinedAt: string;
  bio: string;
  specialties: string[];
}

export interface GameInfo {
  code: GameCode;
  name: string;
  icon: string;
  tiers: TierRank[];
  tierLabels: Record<TierRank, string>;
  tierOrder: Record<TierRank, number>;
  tierBasePrice: Record<TierRank, number>;
}

export interface BoostRequirement {
  id: string;
  publisherId: string;
  gameCode: GameCode;
  fromTier: TierRank;
  toTier: TierRank;
  serviceType: ServiceType;
  expectedWins?: number;
  durationHours?: number;
  winRateGuarantee: number;
  heroPool?: string[];
  premiumHours?: string[];
  basePrice: number;
  surgeCoefficient: number;
  finalPrice: number;
  depositAmount: number;
  createdAt: string;
  status: 'Open' | 'Taken' | 'Filled';
}

export interface Milestone {
  id: string;
  orderId: string;
  type: MilestoneType;
  description: string;
  timestamp: string;
  verified: boolean;
  proofUrl?: string;
  gameResult?: 'Win' | 'Loss' | 'Draw' | 'N/A';
}

export interface EvidenceItem {
  id: string;
  orderId: string;
  disputeId?: string;
  type: EvidenceType;
  url: string;
  hash: string;
  uploadedBy: string;
  uploadedAt: string;
  title: string;
  size?: number;
}

export interface OrderContract {
  id: string;
  requirementId: string;
  requirement?: BoostRequirement;
  providerId: string;
  playerId: string;
  status: OrderStatus;
  totalPrice: number;
  depositPaid: number;
  platformFee: number;
  guaranteeClauses: string[];
  signedAt: string;
  deadlineAt: string;
  completedAt?: string;
  milestones: Milestone[];
  evidence: EvidenceItem[];
  progress: number;
}

export interface DisputeCase {
  id: string;
  orderId: string;
  initiatorId: string;
  respondentId: string;
  status: DisputeStatus;
  reasonCategory: string;
  description: string;
  createdAt: string;
  plaintiffEvidence: EvidenceItem[];
  defendantEvidence: EvidenceItem[];
  reviewers: string[];
  votes: DisputeVote[];
  verdict?: DisputeVerdict;
}

export interface DisputeVote {
  reviewerId: string;
  votedFor: DisputeSide;
  reason: string;
  votedAt: string;
}

export interface DisputeVerdict {
  winner: DisputeSide;
  refundRatio: number;
  reason: string;
  decidedAt: string;
}

export interface Wallet {
  userId: string;
  available: number;
  inEscrow: number;
  frozen: number;
  totalEarnings: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'Deposit' | 'Withdraw' | 'Payment' | 'Refund' | 'Settlement' | 'DisputeCompensation';
  amount: number;
  orderId?: string;
  createdAt: string;
  status: 'Pending' | 'Completed' | 'Failed';
}

export interface RiskScore {
  userId: string;
  deviceFingerprint: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  anomalyFlags: string[];
  lastCheck: string;
}

export interface Review {
  id: string;
  orderId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  score: number;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface RecentTrade {
  id: string;
  orderId: string;
  game: GameCode;
  providerName: string;
  playerName: string;
  tier: string;
  amount: number;
  completedAt: string;
}

export interface RiskEvent {
  time: string;
  anomalyCount: number;
  blockCount: number;
  deviceCount: number;
}
