import { create } from 'zustand';
import type {
  User,
  AIQuoteRequest,
  AIQuoteResult,
  Designer,
  ConstructionProject,
  MaterialProduct,
  DisputeCase,
  DashboardStats,
  CreditHistory,
  DecorationStyle,
  MaterialPreference,
} from '../types';
import { mockCurrentUser, mockUsers, mockCreditHistory } from '../data/mockUsers';
import { mockQuoteRequests, mockQuoteResults, materialOptions } from '../data/mockQuotes';
import { mockDesigners } from '../data/mockDesigners';
import { mockProjects, mockDashboardStats } from '../data/mockProjects';
import { mockProducts } from '../data/mockProducts';
import { mockDisputes, mockCompensationRules } from '../data/mockDisputes';

interface AppState {
  currentUser: User;
  users: User[];
  quoteRequests: AIQuoteRequest[];
  quoteResults: AIQuoteResult[];
  designers: Designer[];
  projects: ConstructionProject[];
  products: MaterialProduct[];
  disputes: DisputeCase[];
  dashboardStats: typeof mockDashboardStats;
  creditHistory: CreditHistory[];
  compensationRules: typeof mockCompensationRules;
  isGeneratingQuote: boolean;
  selectedDesigner: Designer | null;
  selectedProject: ConstructionProject | null;
  selectedProduct: MaterialProduct | null;
  selectedDispute: DisputeCase | null;

  setSelectedDesigner: (designer: Designer | null) => void;
  setSelectedProject: (project: ConstructionProject | null) => void;
  setSelectedProduct: (product: MaterialProduct | null) => void;
  setSelectedDispute: (dispute: DisputeCase | null) => void;
  
  generateQuote: (
    area: number,
    rooms: number,
    style: DecorationStyle,
    materialPreference: MaterialPreference,
    floorPlanImage?: string
  ) => Promise<AIQuoteResult>;
  
  updateDisputeStatus: (disputeId: string, status: string) => void;
  addEvidenceToDispute: (disputeId: string, evidence: any) => void;
  calculateCompensation: (ruleId: string, params: any) => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  users: mockUsers,
  quoteRequests: mockQuoteRequests,
  quoteResults: mockQuoteResults,
  designers: mockDesigners,
  projects: mockProjects,
  products: mockProducts,
  disputes: mockDisputes,
  dashboardStats: mockDashboardStats,
  creditHistory: mockCreditHistory,
  compensationRules: mockCompensationRules,
  isGeneratingQuote: false,
  selectedDesigner: null,
  selectedProject: null,
  selectedProduct: null,
  selectedDispute: null,

  setSelectedDesigner: (designer) => set({ selectedDesigner: designer }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedDispute: (dispute) => set({ selectedDispute: dispute }),

  generateQuote: async (area, rooms, style, materialPreference, floorPlanImage) => {
    set({ isGeneratingQuote: true });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const materialMultiplier = materialOptions.find((m) => m.value === materialPreference)?.multiplier || 1;
    const basePrice = area * 1800 * materialMultiplier;

    const labor = basePrice * 0.3;
    const auxiliaryMaterials = basePrice * 0.2;
    const mainMaterials = basePrice * 0.35;
    const managementFee = basePrice * 0.1;
    const designFee = basePrice * 0.05;

    const categories = [
      { name: '拆除工程', items: ['墙体拆除', '地面铲除'] },
      { name: '水电工程', items: ['强电改造', '弱电改造', '给排水改造'] },
      { name: '泥瓦工程', items: ['墙面找平', '地砖铺设', '墙砖铺设'] },
      { name: '木工工程', items: ['吊顶制作', '定制衣柜', '定制橱柜'] },
      { name: '油漆工程', items: ['墙面乳胶漆', '木器漆'] },
      { name: '安装工程', items: ['地板安装', '灯具安装', '洁具安装'] },
      { name: '主材', items: ['地砖', '木地板', '墙砖', '室内门'] },
    ];

    const itemizedQuotes = categories.flatMap((cat) =>
      cat.items.map((item) => ({
        category: cat.name,
        name: item,
        unit: Math.random() > 0.5 ? '㎡' : '项',
        quantity: Number((Math.random() * 50 + 5).toFixed(1)),
        unitPrice: Math.floor(Math.random() * 500 + 80),
        totalPrice: 0,
      }))
    ).map((item) => ({
      ...item,
      totalPrice: Number((item.quantity * item.unitPrice).toFixed(0)),
    }));

    const newRequest: AIQuoteRequest = {
      id: `qr${Date.now()}`,
      ownerId: get().currentUser.id,
      floorPlanImage: floorPlanImage || '',
      area,
      rooms,
      style,
      materialPreference,
      createdAt: new Date(),
    };

    const newResult: AIQuoteResult = {
      id: `qres${Date.now()}`,
      requestId: newRequest.id,
      totalPrice: Math.floor(basePrice),
      breakdown: {
        labor: Math.floor(labor),
        auxiliaryMaterials: Math.floor(auxiliaryMaterials),
        mainMaterials: Math.floor(mainMaterials),
        managementFee: Math.floor(managementFee),
        designFee: Math.floor(designFee),
      },
      itemizedQuotes,
      generatedAt: new Date(),
    };

    set((state) => ({
      quoteRequests: [...state.quoteRequests, newRequest],
      quoteResults: [...state.quoteResults, newResult],
      isGeneratingQuote: false,
    }));

    return newResult;
  },

  updateDisputeStatus: (disputeId, status) => {
    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === disputeId ? { ...d, status: status as any } : d
      ),
    }));
  },

  addEvidenceToDispute: (disputeId, evidence) => {
    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === disputeId
          ? { ...d, evidenceChain: [...d.evidenceChain, evidence] }
          : d
      ),
    }));
  },

  calculateCompensation: (ruleId, params) => {
    const rule = get().compensationRules.find((r) => r.id === ruleId);
    if (!rule) return 0;

    if (ruleId === 'rule001') {
      const { contractTotal, delayDays } = params;
      const amount = contractTotal * 0.0005 * delayDays;
      return Math.min(amount, rule.maxAmount);
    }

    if (ruleId === 'rule002') {
      const { reworkCost, materialCost, actualLoss } = params;
      const amount = reworkCost + materialCost + actualLoss;
      return Math.min(amount, rule.maxAmount);
    }

    if (ruleId === 'rule003') {
      const { materialPrice } = params;
      const amount = materialPrice * 3;
      return Math.min(amount, rule.maxAmount);
    }

    if (ruleId === 'rule004') {
      const { additionalCost } = params;
      const amount = additionalCost * 1.5;
      return Math.min(amount, rule.maxAmount);
    }

    return 0;
  },
}));
