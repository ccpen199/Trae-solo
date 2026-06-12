import { create } from 'zustand';
import type {
  User,
  EtcCard,
  Vehicle,
  TrafficRecord,
  Outlet,
  OBU,
  ExceptionEvent,
  SettlementRecord,
  DashboardStats,
  RechargeMethod,
  RechargeOrder,
  RouteOption,
  TollStation,
} from '../../shared/types';
import {
  mockUser,
  mockEtcCard,
  mockVehicle,
  mockTrafficRecords,
  mockOutlets,
  mockOBUs,
  mockExceptionEvents,
  mockSettlementRecords,
  mockDashboardStats,
  mockRechargeMethods,
  mockRechargeOrders,
  mockTollStations,
  generateRoutes,
  mockMonthlyTrafficData,
  mockDailyTrafficData,
} from '../mock/data';
import { tollEngine } from '../../shared/engine/TollEngine';

interface AppState {
  user: User;
  etcCard: EtcCard;
  vehicle: Vehicle;
  trafficRecords: TrafficRecord[];
  outlets: Outlet[];
  obus: OBU[];
  exceptionEvents: ExceptionEvent[];
  settlementRecords: SettlementRecord[];
  dashboardStats: DashboardStats;
  rechargeMethods: RechargeMethod[];
  rechargeOrders: RechargeOrder[];
  tollStations: TollStation[];
  calculatedRoutes: RouteOption[];
  holidayInfo: { isFree: boolean; holidayName: string; freePeriod: string } | null;
  monthlyTrafficData: typeof mockMonthlyTrafficData;
  dailyTrafficData: typeof mockDailyTrafficData;
  selectedTrafficRecord: TrafficRecord | null;
  selectedOutlet: Outlet | null;
  isAdminView: boolean;
  setIsAdminView: (value: boolean) => void;
  selectTrafficRecord: (record: TrafficRecord | null) => void;
  selectOutlet: (outlet: Outlet | null) => void;
  calculateToll: (startId: string, endId: string, vehicleType: number, travelDate: string) => void;
  rechargeBalance: (amount: number) => void;
  updateWorkOrderStatus: (eventId: string, status: ExceptionEvent['status']) => void;
  createAppointment: (outletId: string, businessType: string, time: string) => Promise<boolean>;
  payPendingFee: (recordId: string, payMethod: 'balance' | 'wechat' | 'alipay') => Promise<boolean>;
  enableAutoPay: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: mockUser,
  etcCard: mockEtcCard,
  vehicle: mockVehicle,
  trafficRecords: mockTrafficRecords,
  outlets: mockOutlets,
  obus: mockOBUs,
  exceptionEvents: mockExceptionEvents,
  settlementRecords: mockSettlementRecords,
  dashboardStats: mockDashboardStats,
  rechargeMethods: mockRechargeMethods,
  rechargeOrders: mockRechargeOrders,
  tollStations: mockTollStations,
  calculatedRoutes: [],
  holidayInfo: null,
  monthlyTrafficData: mockMonthlyTrafficData,
  dailyTrafficData: mockDailyTrafficData,
  selectedTrafficRecord: null,
  selectedOutlet: null,
  isAdminView: false,

  setIsAdminView: (value) => set({ isAdminView: value }),

  selectTrafficRecord: (record) => set({ selectedTrafficRecord: record }),

  selectOutlet: (outlet) => set({ selectedOutlet: outlet }),

  calculateToll: (startId, endId, vehicleType, travelDate) => {
    const routes = generateRoutes(startId, endId, vehicleType, new Date(travelDate));
    const holidayInfo = tollEngine.getHolidayInfo(new Date(travelDate));
    set({ calculatedRoutes: routes, holidayInfo });
  },

  rechargeBalance: (amount) => {
    set((state) => ({
      etcCard: {
        ...state.etcCard,
        balance: Math.round((state.etcCard.balance + amount) * 100) / 100,
      },
      rechargeOrders: [
        {
          id: `o${Date.now()}`,
          cardId: state.etcCard.id,
          amount,
          method: '在线充值',
          payChannel: 'wechat',
          status: '已完成',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
        ...state.rechargeOrders,
      ],
    }));
  },

  updateWorkOrderStatus: (eventId, status) => {
    set((state) => ({
      exceptionEvents: state.exceptionEvents.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status,
              resolvedAt: status === '已解决' || status === '已关闭' ? new Date().toISOString() : null,
            }
          : e
      ),
    }));
  },

  createAppointment: async (outletId, businessType, time) => {
    const outlet = get().outlets.find((o) => o.id === outletId);
    if (!outlet) return false;

    await new Promise((resolve) => setTimeout(resolve, 500));

    const queueNo = `A${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    console.log('预约成功:', { outletId, businessType, time, queueNo });
    return true;
  },

  payPendingFee: async (recordId, payMethod) => {
    const record = get().trafficRecords.find((r) => r.id === recordId);
    if (!record || record.status !== '待扣费') return false;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    set((state) => {
      let newBalance = state.etcCard.balance;
      if (payMethod === 'balance') {
        newBalance = Math.round((state.etcCard.balance - record.actualFee) * 100) / 100;
      }

      return {
        trafficRecords: state.trafficRecords.map((r) =>
          r.id === recordId
            ? { ...r, status: '已完成' as const, paymentMethod: payMethod === 'autopay' ? 'autopay' : 'balance' }
            : r
        ),
        etcCard: { ...state.etcCard, balance: newBalance },
      };
    });

    return true;
  },

  enableAutoPay: () => {
    set((state) => ({
      etcCard: { ...state.etcCard, autoPayEnabled: true },
    }));
  },
}));
