import { create } from 'zustand';
import type { WorkOrder } from '@/types/entity';
import { SLA_WARNING_THRESHOLD_HOURS, SLA_CRITICAL_THRESHOLD_HOURS } from '@/constants/enums';

export type SLAWarningLevel = 'normal' | 'warning' | 'critical';

export interface SLAWarningItem {
  workOrder: WorkOrder;
  remainingMinutes: number;
  level: SLAWarningLevel;
}

interface WorkOrderState {
  realtimeCounts: {
    pending: number;
    inProgress: number;
    todayNew: number;
    completedToday: number;
  };
  slaWarningList: SLAWarningItem[];
  lastUpdated: string | null;
  setRealtimeCounts: (counts: Partial<WorkOrderState['realtimeCounts']>) => void;
  setSlaWarningList: (list: SLAWarningItem[]) => void;
  addSlaWarning: (item: SLAWarningItem) => void;
  removeSlaWarning: (workOrderId: string) => void;
  updateSlaWarning: (workOrderId: string, remainingMinutes: number) => void;
  incrementCount: (key: keyof WorkOrderState['realtimeCounts']) => void;
  decrementCount: (key: keyof WorkOrderState['realtimeCounts']) => void;
  refreshLastUpdated: () => void;
  getSLAWarningLevel: (remainingMinutes: number) => SLAWarningLevel;
}

const getSLAWarningLevel = (remainingMinutes: number): SLAWarningLevel => {
  if (remainingMinutes <= SLA_CRITICAL_THRESHOLD_HOURS * 60) {
    return 'critical';
  }
  if (remainingMinutes <= SLA_WARNING_THRESHOLD_HOURS * 60) {
    return 'warning';
  }
  return 'normal';
};

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  realtimeCounts: {
    pending: 0,
    inProgress: 0,
    todayNew: 0,
    completedToday: 0,
  },
  slaWarningList: [],
  lastUpdated: null,

  setRealtimeCounts: (counts) => {
    set((state) => ({
      realtimeCounts: { ...state.realtimeCounts, ...counts },
    }));
  },

  setSlaWarningList: (list) => {
    set({ slaWarningList: list });
  },

  addSlaWarning: (item) => {
    set((state) => {
      const exists = state.slaWarningList.some(
        (i) => i.workOrder.id === item.workOrder.id
      );
      if (exists) {
        return {
          slaWarningList: state.slaWarningList.map((i) =>
            i.workOrder.id === item.workOrder.id ? item : i
          ),
        };
      }
      return {
        slaWarningList: [...state.slaWarningList, item],
      };
    });
  },

  removeSlaWarning: (workOrderId) => {
    set((state) => ({
      slaWarningList: state.slaWarningList.filter(
        (item) => item.workOrder.id !== workOrderId
      ),
    }));
  },

  updateSlaWarning: (workOrderId, remainingMinutes) => {
    const level = get().getSLAWarningLevel(remainingMinutes);
    set((state) => ({
      slaWarningList: state.slaWarningList.map((item) =>
        item.workOrder.id === workOrderId
          ? { ...item, remainingMinutes, level }
          : item
      ),
    }));
  },

  incrementCount: (key) => {
    set((state) => ({
      realtimeCounts: {
        ...state.realtimeCounts,
        [key]: state.realtimeCounts[key] + 1,
      },
    }));
  },

  decrementCount: (key) => {
    set((state) => ({
      realtimeCounts: {
        ...state.realtimeCounts,
        [key]: Math.max(0, state.realtimeCounts[key] - 1),
      },
    }));
  },

  refreshLastUpdated: () => {
    set({ lastUpdated: new Date().toISOString() });
  },

  getSLAWarningLevel,
}));
