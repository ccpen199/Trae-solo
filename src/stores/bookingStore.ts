import { create } from 'zustand';
import type { ServiceItem, Store, Staff, Appointment, Schedule, AppointmentStatus } from '@/types/appointment';
import { appointmentService } from '@/services/appointmentService';

interface BookingState {
  step: 1 | 2 | 3 | 4;
  selectedService: ServiceItem | null;
  selectedStore: Store | null;
  selectedStaff: Staff | null;
  selectedDate: string | null;
  selectedTime: string | null;
  services: ServiceItem[];
  stores: Store[];
  staff: Staff[];
  appointments: Appointment[];
  schedules: Schedule[];
  timeSlots: { time: string; available: boolean }[];
  isLoading: boolean;
  error: string | null;

  setStep: (step: 1 | 2 | 3 | 4) => void;
  selectService: (service: ServiceItem) => void;
  selectStore: (store: Store) => void;
  selectStaff: (staff: Staff | null) => void;
  selectDateTime: (date: string, time: string) => void;
  fetchServices: () => Promise<void>;
  fetchStores: () => Promise<void>;
  fetchStoreStaff: (storeId: string) => Promise<void>;
  fetchAvailability: (storeId: string, date: string) => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchSchedules: (storeId: string, startDate: string, endDate: string) => Promise<void>;
  createAppointment: (notes?: string) => Promise<Appointment>;
  cancelAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  step: 1,
  selectedService: null,
  selectedStore: null,
  selectedStaff: null,
  selectedDate: null,
  selectedTime: null,
  services: [],
  stores: [],
  staff: [],
  appointments: [],
  schedules: [],
  timeSlots: [],
  isLoading: false,
  error: null,

  setStep: (step) => set({ step }),

  selectService: (service) => {
    set({ selectedService: service, step: 2 });
  },

  selectStore: (store) => {
    set({ selectedStore: store, step: 3 });
    get().fetchStoreStaff(store.id);
  },

  selectStaff: (staff) => set({ selectedStaff: staff }),

  selectDateTime: (date, time) => {
    set({ selectedDate: date, selectedTime: time, step: 4 });
  },

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

  fetchStoreStaff: async (storeId) => {
    set({ isLoading: true });
    try {
      const staff = await appointmentService.getStoreStaff(storeId);
      set({ staff, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取员工列表失败', isLoading: false });
    }
  },

  fetchAvailability: async (storeId, date) => {
    set({ isLoading: true });
    try {
      const slots = await appointmentService.getStoreAvailability(storeId, date);
      set({ timeSlots: slots as { time: string; available: boolean }[], isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取可用时段失败', isLoading: false });
    }
  },

  fetchAppointments: async () => {
    set({ isLoading: true });
    try {
      const appointments = await appointmentService.getAppointments();
      set({ appointments, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取预约列表失败', isLoading: false });
    }
  },

  fetchSchedules: async (storeId, startDate, endDate) => {
    set({ isLoading: true });
    try {
      const schedules = await appointmentService.getSchedules(storeId, startDate, endDate);
      set({ schedules, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取排班失败', isLoading: false });
    }
  },

  createAppointment: async (notes?: string) => {
    const { selectedService, selectedStore, selectedStaff, selectedDate, selectedTime, services } = get();
    if (!selectedService || !selectedStore || !selectedDate || !selectedTime) {
      throw new Error('请完善预约信息');
    }

    set({ isLoading: true });
    try {
      const appointment = await appointmentService.createAppointment({
        ownerId: 'owner_001',
        petId: 'pet_001',
        serviceId: selectedService.id,
        storeId: selectedStore.id,
        staffId: selectedStaff?.id,
        scheduledDate: selectedDate,
        startTime: selectedTime,
        duration: selectedService.durationMinutes,
        status: 'confirmed',
        totalPrice: selectedService.basePrice,
        paidAmount: selectedService.basePrice,
        notes,
      });
      set((state) => ({
        appointments: [appointment, ...state.appointments],
        isLoading: false,
      }));
      return appointment;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建预约失败', isLoading: false });
      throw err;
    }
  },

  cancelAppointment: async (id: string) => {
    set({ isLoading: true });
    try {
      await appointmentService.cancelAppointment(id);
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '取消预约失败', isLoading: false });
    }
  },

  updateAppointmentStatus: (id, status) => {
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    }));
  },

  resetBooking: () => {
    set({
      step: 1,
      selectedService: null,
      selectedStore: null,
      selectedStaff: null,
      selectedDate: null,
      selectedTime: null,
      timeSlots: [],
    });
  },
}));
