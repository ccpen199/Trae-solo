import { create } from 'zustand';
import type {
  ServiceItem,
  Store,
  Employee,
  Appointment,
  StaffSchedule,
  ServiceSOP,
  ServiceTrace,
} from '@/types/appointment';
import { appointmentService } from '@/services/appointmentService';

interface AppointmentState {
  services: ServiceItem[];
  stores: Store[];
  employees: Employee[];
  appointments: Appointment[];
  schedules: StaffSchedule[];
  sops: ServiceSOP[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;

  fetchServices: () => Promise<void>;
  fetchStores: () => Promise<void>;
  fetchEmployees: (storeId?: string) => Promise<void>;
  fetchAppointments: (storeId?: string, status?: string) => Promise<void>;
  fetchSchedules: (storeId?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchSOPs: (serviceId?: string) => Promise<void>;

  createSchedule: (data: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    shiftType: string;
  }) => Promise<void>;

  executeServiceStep: (
    appointmentId: string,
    action: string,
    data?: any
  ) => Promise<void>;

  updateServiceTrace: (
    appointmentId: string,
    stepIndex: number,
    data: Partial<ServiceTrace>
  ) => Promise<void>;

  setCurrentAppointment: (apt: Appointment | null) => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  services: [],
  stores: [],
  employees: [],
  appointments: [],
  schedules: [],
  sops: [],
  currentAppointment: null,
  isLoading: false,
  error: null,

  fetchServices: async () => {
    set({ isLoading: true });
    try {
      const services = await appointmentService.getServices();
      set({ services, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取服务列表失败', isLoading: false });
    }
  },

  fetchStores: async () => {
    set({ isLoading: true });
    try {
      const stores = await appointmentService.getStores();
      set({ stores, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取门店列表失败', isLoading: false });
    }
  },

  fetchEmployees: async (storeId = 'store_001') => {
    set({ isLoading: true });
    try {
      const employees = await appointmentService.getStoreStaff(storeId);
      set({ employees, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取员工列表失败', isLoading: false });
    }
  },

  fetchAppointments: async (storeId = 'store_001', status) => {
    set({ isLoading: true });
    try {
      const appointments = await appointmentService.getAppointments();
      set({ appointments, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取预约列表失败', isLoading: false });
    }
  },

  fetchSchedules: async (storeId = 'store_001', startDate, endDate) => {
    set({ isLoading: true });
    try {
      const schedules = await appointmentService.getSchedules(storeId, startDate!, endDate!);
      set({ schedules, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取排班失败', isLoading: false });
    }
  },

  fetchSOPs: async (serviceId) => {
    set({ isLoading: true });
    try {
      const sops = await (appointmentService as any).getServiceSOPs?.(serviceId) || [];
      set({ sops: Array.isArray(sops) ? sops : [], isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取SOP失败', isLoading: false });
      set({ sops: [] });
    }
  },

  createSchedule: async (data) => {
    set({ isLoading: true });
    try {
      const newSchedule: StaffSchedule = {
        id: `sch_${Date.now()}`,
        storeId: 'store_001',
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        shiftType: data.shiftType as any,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        schedules: [...state.schedules, newSchedule],
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建排班失败', isLoading: false });
    }
  },

  executeServiceStep: async (appointmentId, action, data = {}) => {
    set({ isLoading: true });
    try {
      if (action === 'start_service') {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'in_service' as any } : a
          ),
          isLoading: false,
        }));
      } else if (action === 'complete_step') {
        set((state) => {
          const apt = state.appointments.find((a) => a.id === appointmentId);
          if (!apt) return { isLoading: false };
          const traceRecords = apt.traceRecords || [];
          const stepIndex = data.stepIndex || 0;
          const existingIndex = traceRecords.findIndex((t) => t.stepIndex === stepIndex);
          const newTrace: ServiceTrace = {
            stepIndex,
            status: 'completed',
            completedAt: new Date().toISOString(),
            completedBy: 'staff_001',
            notes: '',
            beforeImageUrl: '',
            afterImageUrl: '',
          };
          const newTraceRecords = [...traceRecords];
          if (existingIndex >= 0) {
            newTraceRecords[existingIndex] = { ...newTraceRecords[existingIndex], status: 'completed' as any, completedAt: new Date().toISOString() };
          } else {
            newTraceRecords.push(newTrace);
          }
          return {
            appointments: state.appointments.map((a) =>
              a.id === appointmentId ? { ...a, traceRecords: newTraceRecords } : a
            ),
            isLoading: false,
          };
        });
      } else if (action === 'complete_service') {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'completed' as any } : a
          ),
          isLoading: false,
        }));
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '操作失败', isLoading: false });
    }
  },

  updateServiceTrace: async (appointmentId, stepIndex, data) => {
    set((state) => {
      const apt = state.appointments.find((a) => a.id === appointmentId);
      if (!apt) return {};
      const traceRecords = apt.traceRecords || [];
      const existingIndex = traceRecords.findIndex((t) => t.stepIndex === stepIndex);
      const newTraceRecords = [...traceRecords];
      if (existingIndex >= 0) {
        newTraceRecords[existingIndex] = { ...newTraceRecords[existingIndex], ...data };
      } else {
        newTraceRecords.push({
          stepIndex,
          status: 'in_progress',
          ...data,
        } as ServiceTrace);
      }
      return {
        appointments: state.appointments.map((a) =>
          a.id === appointmentId ? { ...a, traceRecords: newTraceRecords } : a
        ),
      };
    });
  },

  setCurrentAppointment: (apt) => set({ currentAppointment: apt }),
}));
