export interface Activity {
  id: number;
  name: string;
  description: string;
  theme: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'published' | 'ended';
  participationRules: ParticipationRules;
  lotteryRules: LotteryRules;
  pageConfig: PageConfig;
  createdAt: string;
  updatedAt: string;
  prizeConfigs?: PrizeConfig[];
}

export interface ParticipationRules {
  requireLogin?: boolean;
  minAmount?: number;
  channels?: string[];
  dailyLimit?: number;
  totalLimit?: number;
  requiredTasks?: TaskConfig[];
  eligibleUserGroups?: string[];
}

export interface TaskConfig {
  id: string;
  name: string;
  type: 'view' | 'share' | 'login' | 'custom';
  description: string;
}

export interface LotteryRules {
  type: 'wheel' | 'grid' | 'slot';
  probabilityMode?: 'equal' | 'weighted' | 'custom';
  costPerDraw?: number;
  winLimit?: number;
  preventDuplicateWin?: boolean;
}

export interface PageConfig {
  bannerImage?: string;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
}

export interface Prize {
  id: number;
  name: string;
  type: 'physical' | 'coupon' | 'points' | 'virtual';
  value: number;
  totalStock: number;
  usedStock: number;
  imageUrl?: string;
  expireTime?: string;
  createdAt: string;
}

export interface PrizeConfig {
  id: number;
  activityId: number;
  prizeId: number;
  probability: number;
  position: number;
  prize?: Prize;
}

export interface User {
  id: string;
  phone?: string;
  nickname?: string;
  createdAt: string;
}

export interface Participation {
  id: number;
  activityId: number;
  userId: string;
  channel: string;
  deviceId?: string;
  ip?: string;
  qualified: boolean;
  disqualifyReason?: string;
  drawCount: number;
  tasksCompleted: string[];
  createdAt: string;
}

export interface LotteryRecord {
  id: number;
  participationId: number;
  activityId: number;
  userId: string;
  prizeId?: number;
  isWin: boolean;
  drawTime: string;
  riskStatus: 'normal' | 'pending' | 'rejected' | 'approved';
  prize?: Prize;
}

export interface Winner {
  id: number;
  lotteryRecordId: number;
  activityId: number;
  userId: string;
  prizeId: number;
  status: 'pending' | 'distributed' | 'shipped' | 'delivered' | 'redeemed' | 'cancelled';
  shippingInfo?: ShippingInfo;
  distributeTime?: string;
  redeemTime?: string;
  createdAt: string;
  prize?: Prize;
  activity?: Activity;
  user?: User;
}

export interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  trackingNumber?: string;
  courier?: string;
}

export interface RiskItem {
  id: number;
  type: 'abnormal_account' | 'device_fraud' | 'address_cluster' | 'high_frequency';
  level: 'low' | 'medium' | 'high';
  activityId?: number;
  lotteryRecordId?: number;
  userId?: string;
  evidence: RiskEvidence;
  status: 'pending' | 'processed' | 'dismissed';
  processedBy?: number;
  processedAt?: string;
  processNote?: string;
  createdAt: string;
  lotteryRecord?: LotteryRecord;
  user?: User;
}

export interface RiskEvidence {
  ip?: string;
  deviceId?: string;
  userAgent?: string;
  drawFrequency?: number;
  sameAddressCount?: number;
  sameDeviceCount?: number;
  behaviorPattern?: string;
  timestamps?: string[];
}

export interface Admin {
  id: number;
  username: string;
  role: 'admin' | 'operator' | 'risk' | 'finance';
  createdAt: string;
}

export interface ReportSummary {
  activityId: number;
  activityName?: string;
  totalParticipants: number;
  uniqueUsers: number;
  drawCount: number;
  conversionRate: number;
  totalWinCount: number;
  winRate: number;
  totalCost: number;
  distributionRate: number;
  complaintCount: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DrawRequest {
  activityId: number;
  userId: string;
  deviceId?: string;
  channel: string;
}

export interface DrawResponse {
  isWin: boolean;
  prize?: Prize;
  lotteryRecordId: number;
  nextDrawAvailableAt?: string;
  riskStatus?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface RiskProcessRequest {
  action: 'approve' | 'reject' | 'dismiss' | 'ban';
  note: string;
}

import type { Request } from 'express';

export interface AuthRequest extends Request {
  admin?: Admin;
}
