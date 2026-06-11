import { create } from 'zustand';
import type { AttendanceRecord, AttendanceStats, CheckInRequest, AttendanceQueryParams } from '@shared/types';
import { attendanceApi, statisticsApi } from '@/api/endpoints';

interface AttendanceState {
  todayRecords: AttendanceRecord[];
  historyRecords: AttendanceRecord[];
  statistics: AttendanceStats[];
  loading: boolean;
  checkInLoading: boolean;
  lastCheckIn: AttendanceRecord | null;
  total: number;

  getTodayRecords: (params?: AttendanceQueryParams) => Promise<void>;
  getHistoryRecords: (params?: AttendanceQueryParams) => Promise<void>;
  getStatistics: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) => Promise<void>;
  checkIn: (data: CheckInRequest) => Promise<AttendanceRecord>;
  clearLastCheckIn: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  todayRecords: [],
  historyRecords: [],
  statistics: [],
  loading: false,
  checkInLoading: false,
  lastCheckIn: null,
  total: 0,

  getTodayRecords: async (params) => {
    set({ loading: true });
    try {
      const response = await attendanceApi.getList(params || {});
      set({
        todayRecords: response.list,
        total: response.total,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getHistoryRecords: async (params) => {
    set({ loading: true });
    try {
      const response = await attendanceApi.getList(params || {});
      set({
        historyRecords: response.list,
        total: response.total,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getStatistics: async (params) => {
    set({ loading: true });
    try {
      const data = await statisticsApi.getAttendanceStats(params);
      set({
        statistics: data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  checkIn: async (data) => {
    set({ checkInLoading: true });
    try {
      const record = await attendanceApi.checkIn(data);
      set({
        lastCheckIn: record,
        checkInLoading: false,
      });
      return record;
    } catch (error) {
      set({ checkInLoading: false });
      throw error;
    }
  },

  clearLastCheckIn: () => {
    set({ lastCheckIn: null });
  },
}));
