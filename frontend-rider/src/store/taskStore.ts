import { create } from 'zustand';
import type { TaskPool, Order, OrderStatus } from '@shared/types';
import { taskService } from '@/services/task.service';
import { orderService } from '@/services/order.service';

interface TaskState {
  availableTasks: TaskPool[];
  currentTask: TaskPool | null;
  currentOrder: Order | null;
  loading: boolean;
  refreshing: boolean;

  fetchAvailableTasks: (params?: any) => Promise<void>;
  fetchCurrentTask: () => Promise<void>;
  grabTask: (taskId: string) => Promise<any>;
  acceptTask: (taskId: string) => Promise<any>;
  updateOrderStatus: (orderId: string, status: string, remark?: string) => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  availableTasks: [],
  currentTask: null,
  currentOrder: null,
  loading: false,
  refreshing: false,

  fetchAvailableTasks: async (params?: any) => {
    set({ loading: true });
    try {
      const result = await taskService.getAvailableTasks(params);
      set({ availableTasks: result.items, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchCurrentTask: async () => {
    set({ loading: true });
    try {
      const task = await taskService.getCurrentTask();
      set({ currentTask: task, loading: false });
      if (task?.orderId) {
        await get().fetchOrderDetail(task.orderId);
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  grabTask: async (taskId: string) => {
    try {
      const result = await taskService.grabTask({ taskId });
      if (result.success && result.order) {
        set({ currentOrder: result.order });
        await get().fetchCurrentTask();
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  acceptTask: async (taskId: string) => {
    try {
      const result = await taskService.acceptTask({ taskId });
      if (result.success && result.order) {
        set({ currentOrder: result.order });
        await get().fetchCurrentTask();
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: string, remark?: string) => {
    try {
      const order = await orderService.updateOrderStatus(orderId, { status: status as OrderStatus, remark });
      set({ currentOrder: order });
      await get().fetchCurrentTask();
    } catch (error) {
      throw error;
    }
  },

  fetchOrderDetail: async (orderId: string) => {
    try {
      const order = await orderService.getOrderDetail(orderId);
      set({ currentOrder: order });
    } catch (error) {
      throw error;
    }
  },

  setCurrentOrder: (order: Order | null) => {
    set({ currentOrder: order });
  },

  clearTasks: () => {
    set({
      availableTasks: [],
      currentTask: null,
      currentOrder: null,
    });
  },
}));
