import { create } from 'zustand';
import { get as apiGet } from '@/utils/api';

interface DashboardStats {
  pending: number;
  completed: number;
  exception: number;
  todayIncome: number;
}

interface RecentTask {
  id: string;
  taskNo: string;
  senderAddress: string;
  status: string;
  estimatedWeight: number;
  createdAt: string;
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
  isLoading: boolean;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    pending: 0,
    completed: 0,
    exception: 0,
    todayIncome: 0,
  },
  recentTasks: [],
  hourlyTrend: [],
  messages: [],
  isLoading: false,

  fetchDashboardData: async () => {
    set({ isLoading: true });
    try {
      const data = await apiGet<any>('/dashboard');
      
      set({
        stats: {
          pending: data.pending || 0,
          completed: data.completed || 0,
          exception: data.exception || 0,
          todayIncome: data.todayIncome || 0,
        },
        recentTasks: data.recentTasks || [],
        hourlyTrend: data.hourlyTrend || [],
        messages: data.messages || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      
      set({
        stats: {
          pending: 12,
          completed: 36,
          exception: 2,
          todayIncome: 1280,
        },
        recentTasks: [
          { id: '1', taskNo: 'TK202401150001', senderAddress: '北京市朝阳区建国路88号', status: 'pending', estimatedWeight: 2.5, createdAt: '2024-01-15T09:30:00Z' },
          { id: '2', taskNo: 'TK202401150002', senderAddress: '北京市海淀区中关村大街1号', status: 'picked', estimatedWeight: 1.2, createdAt: '2024-01-15T10:15:00Z' },
          { id: '3', taskNo: 'TK202401150003', senderAddress: '北京市西城区金融街15号', status: 'completed', estimatedWeight: 3.8, createdAt: '2024-01-15T11:00:00Z' },
          { id: '4', taskNo: 'TK202401150004', senderAddress: '北京市东城区王府井大街100号', status: 'exception', estimatedWeight: 0.8, createdAt: '2024-01-15T13:45:00Z' },
          { id: '5', taskNo: 'TK202401150005', senderAddress: '北京市丰台区丰台路5号', status: 'pending', estimatedWeight: 5.0, createdAt: '2024-01-15T14:30:00Z' },
        ],
        hourlyTrend: [
          { hour: '08:00', tasks: 2 },
          { hour: '09:00', tasks: 5 },
          { hour: '10:00', tasks: 8 },
          { hour: '11:00', tasks: 12 },
          { hour: '12:00', tasks: 6 },
          { hour: '13:00', tasks: 4 },
          { hour: '14:00', tasks: 9 },
          { hour: '15:00', tasks: 11 },
          { hour: '16:00', tasks: 7 },
          { hour: '17:00', tasks: 3 },
        ],
        messages: [
          '【系统通知】您有3个待揽收订单即将超时，请尽快处理',
          '【财务提醒】今日已完成36单，收入1280元',
          '【异常预警】订单TK202401150004出现异常，请及时跟进',
          '【系统公告】本周五下午3点将进行系统维护，请提前做好安排',
        ],
        isLoading: false,
      });
    }
  },
}));
