import { create } from 'zustand';
import type { Worker, Order, DashboardStats, EscrowRecord, QualityIssue, ProcessPhoto, CheckIn, Quote } from '@/types';
import { workers as initialWorkers } from '@/data/workers';
import { orders as initialOrders } from '@/data/orders';
import { dashboardStats as initialStats, escrowRecords as initialEscrow, qualityIssues as initialIssues, badKeywords, orderTrendData, ratingTrendData } from '@/data/quality';
import { skillCategories } from '@/data/faults';
import { parts, laborRates } from '@/data/parts';

interface AppState {
  currentPage: string;
  setCurrentPage: (page: string) => void;

  workers: Worker[];
  orders: Order[];
  dashboardStats: DashboardStats;
  escrowRecords: EscrowRecord[];
  qualityIssues: QualityIssue[];
  badKeywords: { word: string; count: number }[];
  orderTrendData: { dates: string[]; orders: number[]; completed: number[] };
  ratingTrendData: { dates: string[]; avgRating: number[]; badReviews: number[] };
  skillCategories: typeof skillCategories;
  parts: typeof parts;
  laborRates: typeof laborRates;

  selectedFaultTypeId: string | null;
  setSelectedFaultType: (id: string | null) => void;

  selectedWorkerId: string | null;
  setSelectedWorker: (id: string | null) => void;

  selectedOrderId: string | null;
  setSelectedOrder: (id: string | null) => void;

  currentWorkerId: string;

  acceptOrder: (orderId: string, workerId: string) => void;
  submitQuote: (orderId: string, quote: Quote) => void;
  addCheckIn: (orderId: string, checkIn: CheckIn) => void;
  addProcessPhoto: (orderId: string, photo: ProcessPhoto) => void;
  completeOrder: (orderId: string) => void;
  payForOrder: (orderId: string) => void;
  confirmOrder: (orderId: string, rating: number, comment: string, keywords: string[]) => void;

  addSkillCert: (workerId: string, cert: Worker['skills'][0]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  workers: initialWorkers,
  orders: initialOrders,
  dashboardStats: initialStats,
  escrowRecords: initialEscrow,
  qualityIssues: initialIssues,
  badKeywords,
  orderTrendData,
  ratingTrendData,
  skillCategories,
  parts,
  laborRates,

  selectedFaultTypeId: null,
  setSelectedFaultType: (id) => set({ selectedFaultTypeId: id }),

  selectedWorkerId: null,
  setSelectedWorker: (id) => set({ selectedWorkerId: id }),

  selectedOrderId: null,
  setSelectedOrder: (id) => set({ selectedOrderId: id }),

  currentWorkerId: 'w001',

  acceptOrder: (orderId, workerId) => {
    const { workers, orders } = get();
    const worker = workers.find(w => w.id === workerId);
    set({
      orders: orders.map(o =>
        o.id === orderId ? { ...o, workerId, workerName: worker?.name, status: 'matched' } : o
      ),
    });
  },

  submitQuote: (orderId, quote) => {
    const { orders } = get();
    set({
      orders: orders.map(o =>
        o.id === orderId ? { ...o, quote, status: 'quoted' } : o
      ),
    });
  },

  addCheckIn: (orderId, checkIn) => {
    const { orders } = get();
    set({
      orders: orders.map(o =>
        o.id === orderId
          ? { ...o, checkIns: [...o.checkIns, checkIn], status: checkIn.type === 'complete' ? 'completed' : o.status === 'paid' ? 'in_service' : o.status }
          : o
      ),
    });
  },

  addProcessPhoto: (orderId, photo) => {
    const { orders } = get();
    set({
      orders: orders.map(o =>
        o.id === orderId
          ? { ...o, processPhotos: [...o.processPhotos.filter(p => p.stepIndex !== photo.stepIndex), photo] }
          : o
      ),
    });
  },

  completeOrder: (orderId) => {
    const { orders } = get();
    set({
      orders: orders.map(o =>
        o.id === orderId ? { ...o, status: 'completed' } : o
      ),
    });
  },

  payForOrder: (orderId) => {
    const { orders, escrowRecords } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.quote) return;

    const newEscrow: EscrowRecord = {
      id: `esc${Date.now()}`,
      orderId,
      amount: order.quote.totalAmount,
      status: 'frozen',
      frozenAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      acceptanceAt: null,
      expectedReleaseAt: null,
      releaseAt: null,
      releaseBasis: null,
      homeownerName: order.homeownerName,
      workerName: order.workerName || '',
      faultTypeName: order.faultTypeName,
    };

    set({
      orders: orders.map(o =>
        o.id === orderId ? { ...o, status: 'paid' } : o
      ),
      escrowRecords: [...escrowRecords, newEscrow],
    });
  },

  confirmOrder: (orderId, rating, comment, keywords) => {
    const { orders, escrowRecords, qualityIssues } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const review = {
      rating,
      comment,
      keywords,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, status: 'reviewed' as const, review } : o
    );

    const now = new Date();
    const acceptanceTime = now.toISOString().replace('T', ' ').slice(0, 19);
    const expectedRelease = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const releaseBasis = `业主${order.homeownerName}于${acceptanceTime}确认验收，T+1释放`;

    const updatedEscrow = escrowRecords.map(e =>
      e.orderId === orderId
        ? {
            ...e,
            status: 'released' as const,
            acceptanceAt: acceptanceTime,
            expectedReleaseAt: expectedRelease,
            releaseAt: acceptanceTime,
            releaseBasis,
          }
        : e
    );

    let newIssues = qualityIssues;
    if (rating <= 3) {
      const newIssue: QualityIssue = {
        id: `qi${Date.now()}`,
        orderId,
        workerId: order.workerId || '',
        workerName: order.workerName || '',
        keywords,
        severity: rating <= 2 ? 'high' : 'medium',
        status: 'open',
        reviewComment: comment,
        reviewRating: rating,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      newIssues = [newIssue, ...qualityIssues];
    }

    set({
      orders: updatedOrders,
      escrowRecords: updatedEscrow,
      qualityIssues: newIssues,
    });
  },

  addSkillCert: (workerId, cert) => {
    const { workers } = get();
    set({
      workers: workers.map(w =>
        w.id === workerId
          ? { ...w, skills: [...w.skills, cert] }
          : w
      ),
    });
  },
}));
