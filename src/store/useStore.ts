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
  AutoPayConfig,
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
  autoPayConfig: AutoPayConfig;
  setIsAdminView: (value: boolean) => void;
  selectTrafficRecord: (record: TrafficRecord | null) => void;
  selectOutlet: (outlet: Outlet | null) => void;
  calculateToll: (startId: string, endId: string, vehicleType: number, travelDate: string) => void;
  rechargeBalance: (amount: number) => void;
  updateWorkOrderStatus: (eventId: string, status: ExceptionEvent['status']) => void;
  createAppointment: (outletId: string, businessType: string, time: string) => Promise<boolean>;
  payPendingFee: (recordId: string, payMethod: 'balance' | 'wechat' | 'alipay') => Promise<boolean>;
  enableAutoPay: () => void;
  updateAutoPayConfig: (config: Partial<AutoPayConfig>) => void;
  authorizePayChannel: (channel: 'wechat' | 'alipay' | 'bank') => Promise<boolean>;
  triggerAutoPayForPending: () => Promise<boolean>;
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
  autoPayConfig: {
    enabled: false,
    threshold: 100,
    rechargeAmount: 200,
    payChannel: 'wechat',
    wechatAuthorized: false,
    alipayAuthorized: true,
    bankAuthorized: false,
    lastTriggeredAt: null,
    totalAutoRechargeCount: 3,
    totalAutoRechargeAmount: 600,
  },

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
            ? {
                ...r,
                status: '已完成' as const,
                paymentMethod: payMethod,
                paymentFailureReason: undefined,
                paymentFailureCode: undefined,
                autoPayResult: 'success',
              }
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
      autoPayConfig: { ...state.autoPayConfig, enabled: true },
    }));
  },

  updateAutoPayConfig: (config) => {
    set((state) => ({
      autoPayConfig: { ...state.autoPayConfig, ...config },
      etcCard: {
        ...state.etcCard,
        autoPayEnabled: config.enabled !== undefined ? config.enabled : state.etcCard.autoPayEnabled,
      },
    }));
  },

  authorizePayChannel: async (channel) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set((state) => ({
      autoPayConfig: {
        ...state.autoPayConfig,
        [`${channel}Authorized`]: true,
        payChannel: channel,
      },
    }));
    return true;
  },

  triggerAutoPayForPending: async () => {
    const state = get();
    if (!state.autoPayConfig.enabled) return false;

    const pendingRecords = state.trafficRecords.filter(
      (r) => r.status === '待扣费' && !r.isHolidayFree
    );
    if (pendingRecords.length === 0) return false;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const channelAuthorized =
      (state.autoPayConfig.payChannel === 'wechat' && state.autoPayConfig.wechatAuthorized) ||
      (state.autoPayConfig.payChannel === 'alipay' && state.autoPayConfig.alipayAuthorized) ||
      (state.autoPayConfig.payChannel === 'bank' && state.autoPayConfig.bankAuthorized);

    let newBalance = state.etcCard.balance;
    let recharged = false;
    if (!channelAuthorized) {
      set((s) => ({
        trafficRecords: s.trafficRecords.map((r) =>
          r.status === '待扣费' && !r.isHolidayFree
            ? {
                ...r,
                paymentFailureReason: `${state.autoPayConfig.payChannel === 'wechat' ? '微信' : state.autoPayConfig.payChannel === 'alipay' ? '支付宝' : '银行卡'}代扣未授权，请先完成授权`,
                paymentFailureCode: 'E_AUTH_REQUIRED',
                autoPayTriggered: true,
                autoPayTriggeredAt: new Date().toISOString(),
                autoPayResult: 'failed',
                paymentRetryCount: (r.paymentRetryCount || 0) + 1,
                lastPaymentAttempt: new Date().toISOString(),
              }
            : r
        ),
      }));
      return false;
    }

    const totalPending = pendingRecords.reduce((sum, r) => sum + r.actualFee, 0);
    if (newBalance < totalPending && state.autoPayConfig.enabled) {
      newBalance = newBalance + state.autoPayConfig.rechargeAmount;
      recharged = true;
    }
    newBalance = Math.max(0, newBalance - totalPending);

    set((s) => ({
      trafficRecords: s.trafficRecords.map((r) =>
        r.status === '待扣费' && !r.isHolidayFree
          ? {
              ...r,
              status: '已完成' as const,
              paymentMethod: 'autopay',
              autoPayTriggered: true,
              autoPayTriggeredAt: new Date().toISOString(),
              autoPayResult: 'success',
              paymentFailureReason: undefined,
              paymentFailureCode: undefined,
              lowBalanceWarning: false,
              lowBalanceWarningAt: null,
              lastPaymentAttempt: new Date().toISOString(),
            }
          : r
      ),
      etcCard: { ...s.etcCard, balance: Math.round(newBalance * 100) / 100 },
      autoPayConfig: {
        ...s.autoPayConfig,
        lastTriggeredAt: new Date().toISOString(),
        totalAutoRechargeCount:
          recharged
            ? s.autoPayConfig.totalAutoRechargeCount + 1
            : s.autoPayConfig.totalAutoRechargeCount,
        totalAutoRechargeAmount:
          recharged
            ? s.autoPayConfig.totalAutoRechargeAmount + s.autoPayConfig.rechargeAmount
            : s.autoPayConfig.totalAutoRechargeAmount,
      },
    }));

    return true;
  },
}));
