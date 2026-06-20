import { create } from 'zustand';
import { get as apiGet } from '@/utils/api';
import type { WaybillAccount, BankCard, WithdrawRecord } from 'shared/types';

export interface AlertBanner {
  id: string;
  type: 'balance_alert' | 'pickup_reminder' | 'suspension_notice' | 'withdraw_notice' | 'exception_alert' | 'info';
  level: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  content: string;
  actionLabel?: string;
  actionPath?: string;
}

interface DashboardStats {
  pending: number;
  completed: number;
  exception: number;
  todayIncome: number;
  totalTasks: number;
}

interface RecentTask {
  id: string;
  taskNo: string;
  senderAddress: string;
  status: string;
  estimatedWeight: number;
  actualWeight?: number;
  createdAt: string;
  appointmentTime: string;
  freight?: number;
}

interface HourlyTrend {
  hour: string;
  tasks: number;
}

interface DashboardState {
  stats: DashboardStats;
  recentTasks: RecentTask[];
  hourlyTrend: HourlyTrend[];
  messages: string[];
  alerts: AlertBanner[];
  waybill?: WaybillAccount;
  unreadCount: number;
  latestWithdraw?: WithdrawRecord;
  defaultBankCard?: BankCard;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    pending: 0,
    completed: 0,
    exception: 0,
    todayIncome: 0,
    totalTasks: 0,
  },
  recentTasks: [],
  hourlyTrend: [],
  messages: [],
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<any>('/dashboard');

      set({
        stats: {
          pending: data.stats?.pending ?? 0,
          completed: data.stats?.completed ?? 0,
          exception: data.stats?.exception ?? 0,
          todayIncome: data.stats?.todayIncome ?? 0,
          totalTasks: data.stats?.totalTasks ?? 0,
        },
        recentTasks: data.recentTasks || [],
        hourlyTrend: data.hourlyTrend || [],
        messages: data.messages || [],
        alerts: data.alerts || [],
        waybill: data.waybill,
        unreadCount: data.unreadCount || 0,
        latestWithdraw: data.latestWithdraw,
        defaultBankCard: data.defaultBankCard,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Fetch dashboard error:', error);
      set({
        error: error.message || '工作台数据加载失败',
        isLoading: false,
      });
    }
  },
}));
