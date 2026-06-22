import { create } from 'zustand';
import type { User, OrderContract, GameAccount, Wallet, Transaction, ProviderProfile, BoostRequirement, DisputeCase, RiskScore, Review } from '@/types';
import { seedUsers, seedGameAccounts, seedOrders, seedWallet, seedTransactions, seedProviderProfiles, seedRequirements, seedDisputes, seedRiskScore, seedReviews, seedRecentTrades, seedRiskEvents } from '@/data/mock';
import type { RecentTrade, RiskEvent } from '@/types';

interface AppState {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  users: User[];
  getCurrentUser: () => User | undefined;
  getUserById: (id: string) => User | undefined;

  gameAccounts: GameAccount[];
  orders: OrderContract[];
  getOrderById: (id: string) => OrderContract | undefined;
  getOrdersByUser: (userId: string) => OrderContract[];

  wallet: Wallet;
  transactions: Transaction[];

  providers: ProviderProfile[];
  getProviderById: (userId: string) => ProviderProfile | undefined;
  getBoosterProviders: () => (ProviderProfile & { user: User })[];

  requirements: BoostRequirement[];

  disputes: DisputeCase[];
  getDisputeById: (id: string) => DisputeCase | undefined;

  riskScore: RiskScore;
  reviews: Review[];
  getReviewsByUser: (userId: string) => Review[];

  recentTrades: RecentTrade[];
  riskEvents: RiskEvent[];

  acceptOrder: (orderId: string, providerId: string) => void;
  addMilestone: (orderId: string, milestone: Omit<import('@/types').Milestone, 'id'>) => void;
  submitVote: (disputeId: string, vote: import('@/types').DisputeVote) => void;
  resolveDispute: (disputeId: string, verdict: import('@/types').DisputeVerdict) => void;
  completeOrder: (orderId: string) => void;
  createDispute: (orderId: string, initiatorId: string, reason: string, category: string) => string;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: 'u001',
  setCurrentUserId: (id) => set({ currentUserId: id }),
  users: seedUsers,
  getCurrentUser: () => get().users.find(u => u.id === get().currentUserId),
  getUserById: (id) => get().users.find(u => u.id === id),

  gameAccounts: seedGameAccounts,
  orders: seedOrders,
  getOrderById: (id) => get().orders.find(o => o.id === id),
  getOrdersByUser: (userId) => get().orders.filter(o => o.playerId === userId || o.providerId === userId),

  wallet: seedWallet,
  transactions: seedTransactions,

  providers: seedProviderProfiles,
  getProviderById: (userId) => get().providers.find(p => p.userId === userId),
  getBoosterProviders: () => {
    const state = get();
    return state.providers
      .filter(p => state.users.find(u => u.id === p.userId)?.role === 'booster')
      .map(p => ({ ...p, user: state.users.find(u => u.id === p.userId)! }));
  },

  requirements: seedRequirements,

  disputes: seedDisputes,
  getDisputeById: (id) => get().disputes.find(d => d.id === id),

  riskScore: seedRiskScore,
  reviews: seedReviews,
  getReviewsByUser: (userId) => get().reviews.filter(r => r.toUserId === userId),

  recentTrades: seedRecentTrades,
  riskEvents: seedRiskEvents,

  acceptOrder: (orderId, providerId) => set(state => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, providerId, status: 'InProgress' as const } : o),
  })),

  addMilestone: (orderId, milestone) => set(state => ({
    orders: state.orders.map(o => o.id === orderId ? {
      ...o,
      milestones: [...o.milestones, { ...milestone, id: `m_${Date.now()}` }],
    } : o),
  })),

  submitVote: (disputeId, vote) => set(state => ({
    disputes: state.disputes.map(d => d.id === disputeId ? {
      ...d,
      votes: [...d.votes, vote],
      status: d.votes.length + 1 >= 3 ? 'Resolved' as const : d.status,
    } : d),
  })),

  resolveDispute: (disputeId, verdict) => set(state => ({
    disputes: state.disputes.map(d => d.id === disputeId ? { ...d, verdict, status: 'Resolved' as const } : d),
  })),

  completeOrder: (orderId) => set(state => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'Completed' as const, completedAt: new Date().toISOString(), progress: 100 } : o),
  })),

  createDispute: (orderId, initiatorId, reason, category) => {
    const newId = `d_${Date.now()}`;
    const order = get().getOrderById(orderId);
    set(state => ({
      disputes: [...state.disputes, {
        id: newId,
        orderId,
        initiatorId,
        respondentId: order?.providerId || '',
        status: 'Submitted',
        reasonCategory: category,
        description: reason,
        createdAt: new Date().toISOString(),
        plaintiffEvidence: [],
        defendantEvidence: [],
        reviewers: ['u005'],
        votes: [],
      }],
      orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'Disputed' as const } : o),
    }));
    return newId;
  },
}));
