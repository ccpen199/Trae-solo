import { create } from 'zustand';
import type {
  Citizen,
  ElectronicCard,
  TransportCard,
  Transaction,
  ScenicSpot,
  Reservation,
  Coupon,
  PointsAccount,
  NoticeItem,
} from '@/types';
import {
  mockCitizen,
  mockElectronicCards,
  mockTransportCard,
  mockTransactions,
  mockScenics,
  mockReservations,
  mockCoupons,
  mockPointsAccount,
  mockNotices,
} from '@/data/mock';

interface AppState {
  citizen: Citizen | null;
  electronicCards: ElectronicCard[];
  transportCard: TransportCard | null;
  transactions: Transaction[];
  scenics: ScenicSpot[];
  reservations: Reservation[];
  coupons: Coupon[];
  pointsAccount: PointsAccount | null;
  notices: NoticeItem[];
  loading: boolean;
  activeTab: number;

  setActiveTab: (tab: number) => void;
  loadCitizenInfo: () => void;
  loadTransportCard: () => void;
  loadTransactions: () => void;
  loadScenics: () => void;
  loadReservations: () => void;
  loadCoupons: () => void;
  loadPointsAccount: () => void;
  loadNotices: () => void;
  rechargeTransportCard: (amount: number) => Promise<boolean>;
  markNoticeRead: (id: string) => void;
  checkRealName: () => Promise<boolean>;
  bindCard: (cardType: string, cardNumber: string) => Promise<boolean>;
  createReservation: (scenicId: string, timeSlotId: string, visitors: Array<{name: string; idCard: string}>) => Promise<Reservation | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  citizen: null,
  electronicCards: [],
  transportCard: null,
  transactions: [],
  scenics: [],
  reservations: [],
  coupons: [],
  pointsAccount: null,
  notices: [],
  loading: false,
  activeTab: 0,

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadCitizenInfo: () => {
    console.log('[Store] Loading citizen info...');
    set({ citizen: mockCitizen, electronicCards: mockElectronicCards });
  },

  loadTransportCard: () => {
    console.log('[Store] Loading transport card...');
    set({ transportCard: mockTransportCard });
  },

  loadTransactions: () => {
    console.log('[Store] Loading transactions...');
    set({ transactions: mockTransactions });
  },

  loadScenics: () => {
    console.log('[Store] Loading scenics...');
    set({ scenics: mockScenics });
  },

  loadReservations: () => {
    console.log('[Store] Loading reservations...');
    set({ reservations: mockReservations });
  },

  loadCoupons: () => {
    console.log('[Store] Loading coupons...');
    set({ coupons: mockCoupons });
  },

  loadPointsAccount: () => {
    console.log('[Store] Loading points account...');
    set({ pointsAccount: mockPointsAccount });
  },

  loadNotices: () => {
    console.log('[Store] Loading notices...');
    set({ notices: mockNotices });
  },

  rechargeTransportCard: async (amount) => {
    console.log('[Store] Recharging transport card:', amount);
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentCard = get().transportCard;
    if (currentCard) {
      const newBalance = currentCard.balance + amount;
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        cardId: currentCard.id,
        type: 'recharge',
        amount,
        balanceAfter: newBalance,
        status: 'success',
        createdAt: new Date(),
      };

      set({
        transportCard: { ...currentCard, balance: newBalance },
        transactions: [newTransaction, ...get().transactions],
        loading: false,
      });
      console.log('[Store] Recharge successful');
      return true;
    }
    set({ loading: false });
    return false;
  },

  markNoticeRead: (id) => {
    console.log('[Store] Marking notice read:', id);
    set({
      notices: get().notices.map(n => n.id === id ? { ...n, isRead: true } : n),
    });
  },

  checkRealName: async () => {
    console.log('[Store] Checking real name...');
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const citizen = get().citizen;
    if (citizen && !citizen.realNameVerified) {
      set({
        citizen: {
          ...citizen,
          realNameVerified: true,
          realNameVerifiedAt: new Date(),
          faceVerified: true,
        },
        loading: false,
      });
      return true;
    }
    set({ loading: false });
    return citizen?.realNameVerified ?? false;
  },

  bindCard: async (cardType, cardNumber) => {
    console.log('[Store] Binding card:', cardType, cardNumber);
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const cardNames: Record<string, string> = {
      social_security: '社会保障卡',
      medical_insurance: '医疗保险卡',
      driver_license: '驾驶证',
    };

    const newCard: ElectronicCard = {
      id: `card-${Date.now()}`,
      citizenId: get().citizen?.id || '',
      cardType: cardType as any,
      cardNumber,
      cardName: cardNames[cardType] || '电子卡证',
      status: 'active',
      boundAt: new Date(),
    };

    set({
      electronicCards: [...get().electronicCards, newCard],
      loading: false,
    });
    return true;
  },

  createReservation: async (scenicId, timeSlotId, visitors) => {
    console.log('[Store] Creating reservation:', scenicId, timeSlotId);
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const scenic = get().scenics.find(s => s.id === scenicId);
    if (!scenic) {
      set({ loading: false });
      return null;
    }

    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      citizenId: get().citizen?.id || '',
      scenicId,
      scenicName: scenic.name,
      timeSlotId,
      visitorCount: visitors.length,
      visitorNames: visitors.map(v => v.name),
      visitorIdCards: visitors.map(v => v.idCard),
      status: 'confirmed',
      qrCode: `SZ${Date.now()}`,
      createdAt: new Date(),
    };

    set({
      reservations: [newReservation, ...get().reservations],
      loading: false,
    });
    console.log('[Store] Reservation created:', newReservation);
    return newReservation;
  },
}));
