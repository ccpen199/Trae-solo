import { create } from 'zustand';
import { Waybill, Driver, Customer, FreightRule, Invoice, Statement, CustomsDeclaration, SystemAlert, GpsPoint } from '@/types';
import { mockWaybills, mockDrivers, mockCustomers, mockFreightRules, mockInvoices, mockStatements, mockCustomsDeclarations, mockAlerts, mockGpsTrack } from '@/mock/data';

interface AppState {
  waybills: Waybill[];
  drivers: Driver[];
  customers: Customer[];
  freightRules: FreightRule[];
  invoices: Invoice[];
  statements: Statement[];
  customsDeclarations: CustomsDeclaration[];
  alerts: SystemAlert[];
  gpsTrack: GpsPoint[];
  currentUser: {
    name: string;
    role: 'admin' | 'customer';
    customerId?: string;
  };
  selectedWaybill: Waybill | null;
}

interface AppActions {
  setSelectedWaybill: (waybill: Waybill | null) => void;
  addWaybill: (waybill: Waybill) => void;
  updateWaybill: (waybill: Waybill) => void;
  markAlertAsRead: (alertId: string) => void;
  calculateFreight: (weight: number, volume: number, expressType: string) => number;
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  waybills: mockWaybills,
  drivers: mockDrivers,
  customers: mockCustomers,
  freightRules: mockFreightRules,
  invoices: mockInvoices,
  statements: mockStatements,
  customsDeclarations: mockCustomsDeclarations,
  alerts: mockAlerts,
  gpsTrack: mockGpsTrack,
  currentUser: {
    name: '张经理',
    role: 'admin',
  },
  selectedWaybill: null,

  setSelectedWaybill: (waybill) => set({ selectedWaybill: waybill }),

  addWaybill: (waybill) =>
    set((state) => ({
      waybills: [waybill, ...state.waybills],
    })),

  updateWaybill: (waybill) =>
    set((state) => ({
      waybills: state.waybills.map((w) => (w.id === waybill.id ? waybill : w)),
    })),

  markAlertAsRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)),
    })),

  calculateFreight: (weight, volume, expressType) => {
    const rule = get().freightRules.find((r) => r.expressType === expressType);
    if (!rule) return 0;

    let weightPrice = 0;
    let remainingWeight = weight;

    for (const step of rule.steps) {
      if (remainingWeight <= 0) break;
      const stepRange = step.maxWeight ? step.maxWeight - step.minWeight : remainingWeight;
      const inStepWeight = Math.min(remainingWeight, stepRange);
      weightPrice += inStepWeight * step.pricePerKg;
      remainingWeight -= inStepWeight;
    }

    const volumePrice = volume * rule.volumePrice;
    const total = Math.max(rule.basePrice + Math.max(weightPrice, volumePrice), rule.minCharge);

    return Math.round(total * 100) / 100;
  },
}));
