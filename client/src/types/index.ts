export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  email?: string;
  createdAt?: string;
}

export interface Union {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  creatorId: string;
  leaderId: string;
  level: number;
  reputation: number;
  memberCount: number;
  maxMembers: number;
  isRecommend: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
  leader?: User;
  creator?: User;
  levelConfig?: LevelConfig;
  currentMember?: UnionMember | null;
}

export interface UnionMember {
  id: string;
  unionId: string;
  userId: string;
  role: MemberRole;
  contribution: number;
  joinAt: string;
  lastActiveAt: string;
  status: number;
  user?: User;
}

export interface LevelConfig {
  level: number;
  name: string;
  minReputation: number;
  maxReputation: number;
  maxMembers: number;
  dailyCost: number;
  rewardRatio: number;
}

export interface ReputationLog {
  id: string;
  unionId: string;
  userId: string | null;
  type: number;
  action: string;
  amount: number;
  balance: number;
  createdAt: string;
}

export interface ContributionLog {
  id: string;
  unionId: string;
  userId: string;
  type: number;
  action: string;
  amount: number;
  balance: number;
  createdAt: string;
}

export enum MemberRole {
  LEADER = 1,
  VICE_LEADER = 2,
  NORMAL = 3,
}

export enum Status {
  ACTIVE = 1,
  INACTIVE = 0,
}

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface RankItem {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  reputation: number;
  memberCount: number;
  rank: number;
}
