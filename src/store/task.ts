import { create } from 'zustand';
import type { PickupTask, TaskStatus, PaymentMethod, PaginatedResponse } from 'shared/types';
import { get as apiGet, put as apiPut, post as apiPost } from '@/utils/api';

interface TaskFilters {
  status: TaskStatus | 'all';
  startDate?: string;
  endDate?: string;
  pickupCode?: string;
  priority?: 'high' | 'medium' | 'low';
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  page: number;
  pageSize: number;
}

interface OfflineOperation {
  id: string;
  taskId: string;
  type: 'scan' | 'weigh' | 'payment' | 'print';
  data: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
}

interface TaskState {
  tasks: PickupTask[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  currentTask: PickupTask | null;
  viewMode: 'card' | 'table';
  selectedTaskIds: string[];
  offlineOperations: OfflineOperation[];
}

interface TaskActions {
  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<PickupTask | null>;
  setCurrentTask: (task: PickupTask | null) => void;
  updateTask: (id: string, data: Partial<PickupTask>) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'card' | 'table') => void;
  toggleTaskSelection: (taskId: string) => void;
  clearTaskSelection: () => void;
  batchAssignTasks: (taskIds: string[], courierId: string) => Promise<void>;
  addOfflineOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'synced'>) => void;
  syncOfflineData: () => Promise<void>;
  getPendingSyncCount: () => number;
  scanPickupCode: (pickupCode: string) => Promise<PickupTask | null>;
  submitWeight: (taskId: string, weight: number, photos?: string[]) => Promise<void>;
  submitPayment: (taskId: string, method: PaymentMethod, amount: number) => Promise<void>;
  printWaybill: (taskId: string) => Promise<void>;
  calculateFreight: (weight: number, itemType: string) => Promise<{ baseFee: number; weightFee: number; insurance: number; total: number }>;
}

const defaultFilters: TaskFilters = {
  status: 'all',
  page: 1,
  pageSize: 10,
};

const loadOfflineOperations = (): OfflineOperation[] => {
  try {
    const stored = localStorage.getItem('offline_operations');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveOfflineOperations = (operations: OfflineOperation[]) => {
  localStorage.setItem('offline_operations', JSON.stringify(operations));
};

const loadTasksCache = (): { tasks: PickupTask[]; total: number } => {
  try {
    const stored = localStorage.getItem('tasks_cache');
    return stored ? JSON.parse(stored) : { tasks: [], total: 0 };
  } catch {
    return { tasks: [], total: 0 };
  }
};

const saveTasksCache = (tasks: PickupTask[], total: number) => {
  localStorage.setItem('tasks_cache', JSON.stringify({ tasks, total }));
};

export const useTaskStore = create<TaskState & TaskActions>((set, get) => {
  const cached = loadTasksCache();
  const offlineOps = loadOfflineOperations();

  return {
    tasks: cached.tasks,
    total: cached.total,
    loading: false,
    error: null,
    filters: defaultFilters,
    currentTask: null,
    viewMode: 'card',
    selectedTaskIds: [],
    offlineOperations: offlineOps,

    fetchTasks: async () => {
      set({ loading: true, error: null });
      try {
        const { filters } = get();
        const params = new URLSearchParams();
        if (filters.status !== 'all') params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.pickupCode) params.append('pickupCode', filters.pickupCode);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.timeSlot) params.append('timeSlot', filters.timeSlot);
        params.append('page', filters.page.toString());
        params.append('pageSize', filters.pageSize.toString());

        const response = await apiGet(`/tasks?${params.toString()}`) as PaginatedResponse<PickupTask>['data'];
        const tasks = response.list;
        const total = response.total;
        set({ tasks, total, loading: false });
        saveTasksCache(tasks, total);
      } catch (error) {
        set({ error: (error as Error).message || '获取任务列表失败', loading: false });
        const cached = loadTasksCache();
        if (cached.tasks.length > 0) {
          set({ tasks: cached.tasks, total: cached.total });
        }
      }
    },

    getTaskById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const task = await apiGet<PickupTask>(`/tasks/${id}`);
        set({ currentTask: task, loading: false });
        return task;
      } catch (error) {
        set({ error: error.message || '获取任务详情失败', loading: false });
        const cached = loadTasksCache();
        const localTask = cached.tasks.find(t => t.id === id);
        if (localTask) {
          set({ currentTask: localTask });
          return localTask;
        }
        return null;
      }
    },

    setCurrentTask: (task) => set({ currentTask: task }),

    updateTask: async (id, data) => {
      set({ loading: true, error: null });
      try {
        const updated = await apiPut(`/tasks/${id}`, data) as PickupTask;
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? updated : t),
          currentTask: state.currentTask?.id === id ? updated : state.currentTask,
          loading: false,
        }));
      } catch (error) {
        set({ error: error.message || '更新任务失败', loading: false });
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...data, synced: false } : t),
          currentTask: state.currentTask?.id === id ? { ...state.currentTask, ...data, synced: false } : state.currentTask,
        }));
        get().addOfflineOperation({
          taskId: id,
          type: 'scan',
          data,
        });
      }
    },

    setFilters: (newFilters) => {
      set(state => ({ filters: { ...state.filters, ...newFilters } }));
    },

    resetFilters: () => {
      set({ filters: defaultFilters });
    },

    setViewMode: (mode) => {
      set({ viewMode: mode });
    },

    toggleTaskSelection: (taskId) => {
      set(state => ({
        selectedTaskIds: state.selectedTaskIds.includes(taskId)
          ? state.selectedTaskIds.filter(id => id !== taskId)
          : [...state.selectedTaskIds, taskId],
      }));
    },

    clearTaskSelection: () => {
      set({ selectedTaskIds: [] });
    },

    batchAssignTasks: async (taskIds, courierId) => {
      set({ loading: true, error: null });
      try {
        await apiPost('/tasks/batch-assign', { taskIds, courierId });
        set(state => ({
          tasks: state.tasks.map(t => 
            taskIds.includes(t.id) 
              ? { ...t, status: 'assigned' as TaskStatus, courierId, synced: true }
              : t
          ),
          selectedTaskIds: [],
          loading: false,
        }));
      } catch (error) {
        set({ error: error.message || '批量分配失败', loading: false });
        taskIds.forEach(taskId => {
          get().addOfflineOperation({
            taskId,
            type: 'scan',
            data: { status: 'assigned', courierId },
          });
        });
      }
    },

    addOfflineOperation: (operation) => {
      const newOperation: OfflineOperation = {
        ...operation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        synced: false,
      };
      set(state => {
        const operations = [...state.offlineOperations, newOperation];
        saveOfflineOperations(operations);
        return { offlineOperations: operations };
      });
    },

    syncOfflineData: async () => {
      const { offlineOperations } = get();
      const pending = offlineOperations.filter(op => !op.synced);
      
      for (const op of pending) {
        try {
          await apiPost(`/tasks/${op.taskId}/offline-sync`, op.data);
          set(state => ({
            offlineOperations: state.offlineOperations.map(o => 
              o.id === op.id ? { ...o, synced: true } : o
            ),
          }));
        } catch (error) {
          console.error('Sync failed for operation:', op.id, error);
        }
      }
      
      const synced = get().offlineOperations.filter(o => o.synced);
      saveOfflineOperations(synced);
      set({ offlineOperations: synced });
    },

    getPendingSyncCount: () => {
      return get().offlineOperations.filter(op => !op.synced).length;
    },

    scanPickupCode: async (pickupCode) => {
      set({ loading: true, error: null });
      try {
        const task = await apiPost('/tasks/scan', { pickupCode }) as PickupTask;
        set({ currentTask: task, loading: false });
        return task;
      } catch (error) {
        set({ error: error.message || '扫码失败', loading: false });
        const cached = loadTasksCache();
        const localTask = cached.tasks.find(t => t.pickupCode === pickupCode);
        if (localTask) {
          const updated = { ...localTask, status: 'picked' as TaskStatus, synced: false };
          set(state => ({
            currentTask: updated,
            tasks: state.tasks.map(t => t.id === updated.id ? updated : t),
          }));
          get().addOfflineOperation({
            taskId: updated.id,
            type: 'scan',
            data: { pickupCode, status: 'picked' },
          });
          return updated;
        }
        return null;
      }
    },

    submitWeight: async (taskId, weight, photos) => {
      set({ loading: true, error: null });
      try {
        await apiPost(`/tasks/${taskId}/weigh`, { weight, photos });
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, actualWeight: weight, photos, synced: true } : t
          ),
          currentTask: state.currentTask?.id === taskId 
            ? { ...state.currentTask, actualWeight: weight, photos, synced: true }
            : state.currentTask,
          loading: false,
        }));
      } catch (error) {
        set({ error: error.message || '称重失败', loading: false });
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, actualWeight: weight, photos, synced: false } : t
          ),
          currentTask: state.currentTask?.id === taskId 
            ? { ...state.currentTask, actualWeight: weight, photos, synced: false }
            : state.currentTask,
        }));
        get().addOfflineOperation({
          taskId,
          type: 'weigh',
          data: { weight, photos },
        });
      }
    },

    submitPayment: async (taskId, method, amount) => {
      set({ loading: true, error: null });
      try {
        await apiPost(`/tasks/${taskId}/pay`, { method, amount });
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, paymentMethod: method, freight: amount, synced: true } : t
          ),
          currentTask: state.currentTask?.id === taskId 
            ? { ...state.currentTask, paymentMethod: method, freight: amount, synced: true }
            : state.currentTask,
          loading: false,
        }));
      } catch (error) {
        set({ error: error.message || '支付失败', loading: false });
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, paymentMethod: method, freight: amount, synced: false } : t
          ),
          currentTask: state.currentTask?.id === taskId 
            ? { ...state.currentTask, paymentMethod: method, freight: amount, synced: false }
            : state.currentTask,
        }));
        get().addOfflineOperation({
          taskId,
          type: 'payment',
          data: { method, amount },
        });
      }
    },

    printWaybill: async (taskId) => {
      set({ loading: true, error: null });
      try {
        const response = await apiPost(`/tasks/${taskId}/print`) as { waybillNo: string; printedAt: string };
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, waybillNo: response.waybillNo, printedAt: response.printedAt, status: 'in_transit' as TaskStatus, synced: true } : t
          ),
          currentTask: state.currentTask?.id === taskId 
            ? { ...state.currentTask, waybillNo: response.waybillNo, printedAt: response.printedAt, status: 'in_transit' as TaskStatus, synced: true }
            : state.currentTask,
          loading: false,
        }));
      } catch (error) {
        set({ error: error.message || '打印失败', loading: false });
        const mockWaybillNo = 'SF' + Date.now().toString().slice(-10);
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, waybillNo: mockWaybillNo, printedAt: new Date().toISOString(), status: 'in_transit' as TaskStatus, synced: false } : t
          ),
          currentTask: state.currentTask?.id === taskId 
            ? { ...state.currentTask, waybillNo: mockWaybillNo, printedAt: new Date().toISOString(), status: 'in_transit' as TaskStatus, synced: false }
            : state.currentTask,
        }));
        get().addOfflineOperation({
          taskId,
          type: 'print',
          data: { waybillNo: mockWaybillNo, status: 'in_transit' },
        });
      }
    },

    calculateFreight: async (weight, itemType) => {
      try {
        return await apiPost('/tasks/calculate-freight', { weight, itemType }) as { baseFee: number; weightFee: number; insurance: number; total: number };
      } catch {
        const baseFee = 12;
        const weightFee = Math.max(0, weight - 1) * 3;
        const insurance = itemType === '易碎品' || itemType === '贵重物品' ? 5 : 2;
        return {
          baseFee,
          weightFee,
          insurance,
          total: baseFee + weightFee + insurance,
        };
      }
    },
  };
});

export default useTaskStore;
