import { create } from 'zustand';
import type { PickupTask, DeliveryTask, WaybillStatus } from '@/types/waybill';
import type { ExceptionRecord, TaskWarning, DailyStats, TaskHeatmapPoint } from '@/types/task';
import { mockPickupTasks, mockDeliveryTasks } from '@/data/mockWaybills';
import { mockExceptions, mockWarnings, mockDailyStats, mockHeatmapPoints } from '@/data/mockExceptions';

interface TaskState {
  pickupTasks: PickupTask[];
  deliveryTasks: DeliveryTask[];
  exceptions: ExceptionRecord[];
  warnings: TaskWarning[];
  dailyStats: DailyStats;
  heatmapPoints: TaskHeatmapPoint[];
  loading: boolean;
  filter: {
    status?: string;
    type?: string;
    date?: string;
  };
  setFilter: (filter: Partial<TaskState['filter']>) => void;
  getPickupTasks: () => Promise<void>;
  getDeliveryTasks: () => Promise<void>;
  getExceptions: () => Promise<void>;
  getWarnings: () => Promise<void>;
  getDailyStats: () => Promise<void>;
  getHeatmapPoints: () => Promise<void>;
  updatePickupTaskStatus: (taskId: string, status: PickupTask['status']) => Promise<boolean>;
  updateDeliveryTaskStatus: (taskId: string, status: DeliveryTask['status']) => Promise<boolean>;
  reportException: (data: Partial<ExceptionRecord>) => Promise<boolean>;
  markWarningRead: (warningId: string) => void;
  markAllWarningsRead: () => void;
  refreshAll: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  pickupTasks: [],
  deliveryTasks: [],
  exceptions: [],
  warnings: [],
  dailyStats: mockDailyStats,
  heatmapPoints: [],
  loading: false,
  filter: {},

  setFilter: (filter) => {
    set(state => ({ filter: { ...state.filter, ...filter } }));
    console.log('[TaskStore] 更新筛选条件:', filter);
  },

  getPickupTasks: async () => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ pickupTasks: mockPickupTasks, loading: false });
      console.log('[TaskStore] 加载揽件任务成功，共', mockPickupTasks.length, '条');
    } catch (e) {
      console.error('[TaskStore] 加载揽件任务失败:', e);
      set({ loading: false });
    }
  },

  getDeliveryTasks: async () => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ deliveryTasks: mockDeliveryTasks, loading: false });
      console.log('[TaskStore] 加载派件任务成功，共', mockDeliveryTasks.length, '条');
    } catch (e) {
      console.error('[TaskStore] 加载派件任务失败:', e);
      set({ loading: false });
    }
  },

  getExceptions: async () => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ exceptions: mockExceptions, loading: false });
      console.log('[TaskStore] 加载异常件成功，共', mockExceptions.length, '条');
    } catch (e) {
      console.error('[TaskStore] 加载异常件失败:', e);
      set({ loading: false });
    }
  },

  getWarnings: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set({ warnings: mockWarnings });
      console.log('[TaskStore] 加载预警信息成功，共', mockWarnings.length, '条');
    } catch (e) {
      console.error('[TaskStore] 加载预警信息失败:', e);
    }
  },

  getDailyStats: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set({ dailyStats: mockDailyStats });
      console.log('[TaskStore] 加载每日统计成功');
    } catch (e) {
      console.error('[TaskStore] 加载每日统计失败:', e);
    }
  },

  getHeatmapPoints: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set({ heatmapPoints: mockHeatmapPoints });
      console.log('[TaskStore] 加载热力图数据成功，共', mockHeatmapPoints.length, '个点');
    } catch (e) {
      console.error('[TaskStore] 加载热力图数据失败:', e);
    }
  },

  updatePickupTaskStatus: async (taskId, status) => {
    try {
      console.log('[TaskStore] 更新揽件任务状态:', { taskId, status });
      set(state => ({
        pickupTasks: state.pickupTasks.map(task =>
          task.id === taskId
            ? { ...task, status, pickupTime: status === 'picked_up' ? Date.now() : task.pickupTime }
            : task
        )
      }));
      return true;
    } catch (e) {
      console.error('[TaskStore] 更新揽件任务失败:', e);
      return false;
    }
  },

  updateDeliveryTaskStatus: async (taskId, status) => {
    try {
      console.log('[TaskStore] 更新派件任务状态:', { taskId, status });
      set(state => ({
        deliveryTasks: state.deliveryTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                status,
                startTime: status === 'delivering' ? Date.now() : task.startTime,
                deliveredTime: status === 'delivered' ? Date.now() : task.deliveredTime,
                deliveryAttempts: task.deliveryAttempts + 1
              }
            : task
        )
      }));
      return true;
    } catch (e) {
      console.error('[TaskStore] 更新派件任务失败:', e);
      return false;
    }
  },

  reportException: async (data) => {
    try {
      const newException: ExceptionRecord = {
        id: `ex_${Date.now()}`,
        waybillNo: data.waybillNo || '',
        exceptionType: data.exceptionType || 'other',
        severity: data.severity || 'medium',
        status: 'reported',
        description: data.description || '',
        photos: data.photos || [],
        reporterId: data.reporterId || 'courier_001',
        reporterName: data.reporterName || '快递员',
        reportTime: Date.now(),
        reportLocation: data.reportLocation,
        reportLongitude: data.reportLongitude,
        reportLatitude: data.reportLatitude,
        isOvertime: false,
        operationLogs: [{
          id: `log_${Date.now()}`,
          operator: data.reporterName || '快递员',
          action: '异常上报',
          remark: data.description,
          timestamp: Date.now()
        }]
      };

      set(state => ({
        exceptions: [newException, ...state.exceptions]
      }));

      console.log('[TaskStore] 异常上报成功:', newException.id);
      return true;
    } catch (e) {
      console.error('[TaskStore] 异常上报失败:', e);
      return false;
    }
  },

  markWarningRead: (warningId) => {
    set(state => ({
      warnings: state.warnings.map(w =>
        w.id === warningId ? { ...w, isRead: true } : w
      )
    }));
    console.log('[TaskStore] 标记预警已读:', warningId);
  },

  markAllWarningsRead: () => {
    set(state => ({
      warnings: state.warnings.map(w => ({ ...w, isRead: true }))
    }));
    console.log('[TaskStore] 标记所有预警已读');
  },

  refreshAll: async () => {
    console.log('[TaskStore] 刷新所有数据');
    await Promise.all([
      get().getPickupTasks(),
      get().getDeliveryTasks(),
      get().getExceptions(),
      get().getWarnings(),
      get().getDailyStats(),
      get().getHeatmapPoints()
    ]);
  }
}));

export type WaybillStatusUpdate = {
  waybillNo: string;
  status: WaybillStatus;
  operator: string;
  operatorId: string;
  location?: string;
  remark?: string;
};
