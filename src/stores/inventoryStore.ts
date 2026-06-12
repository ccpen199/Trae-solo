import { create } from 'zustand';
import type { InventoryItem, InventoryBatch, Product, PrescriptionReview, Prescription } from '@/types/inventory';
import type { MedicalRecord } from '@/types/medical';
import { inventoryService, storeDashboardService } from '@/services/inventoryService';

interface InventoryState {
  inventory: InventoryItem[];
  inventoryItems: InventoryItem[];
  inventoryAlerts: InventoryItem[];
  lowStockItems: InventoryItem[];
  batches: InventoryBatch[];
  products: Product[];
  cart: { items: Array<{ productId: string; quantity: number; product: Product }>; total: number } | null;
  medicalRecords: MedicalRecord[];
  currentMedicalRecord: MedicalRecord | null;
  prescriptions: Prescription[];
  dashboardData: {
    todayAppointments: number;
    pendingServices: number;
    inventoryAlerts: number;
    todayRevenue: number;
    weeklyAppointments: number[];
    topServices: Array<{ name: string; count: number; revenue: number }>;
  } | null;
  currentReview: PrescriptionReview | null;
  isLoading: boolean;
  error: string | null;

  fetchInventory: (storeId: string) => Promise<void>;
  fetchInventoryItems: (storeId?: string) => Promise<void>;
  fetchInventoryAlerts: (storeId: string) => Promise<void>;
  fetchLowStockItems: (storeId?: string) => Promise<void>;
  fetchBatches: (itemId: string) => Promise<void>;
  fetchProducts: (category?: string) => Promise<void>;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  submitPrescriptionReview: (data: Omit<PrescriptionReview, 'id' | 'status' | 'submittedAt'>) => Promise<PrescriptionReview>;
  fetchReviewStatus: (id: string) => Promise<void>;
  fetchMedicalRecords: (storeId?: string) => Promise<void>;
  createMedicalRecord: (data: Omit<MedicalRecord, 'id'>) => Promise<MedicalRecord>;
  signMedicalRecord: (id: string, signature: string) => Promise<MedicalRecord>;
  setCurrentMedicalRecord: (record: MedicalRecord | null) => void;
  fetchDashboardData: (storeId: string) => Promise<void>;
  fetchPrescriptions: (status?: string) => Promise<void>;
  reviewPrescription: (id: string, approved: boolean, notes?: string) => Promise<void>;
  updateStock: (itemId: string, type: 'in' | 'out', quantity: number, batchNo?: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  inventory: [],
  inventoryItems: [],
  inventoryAlerts: [],
  lowStockItems: [],
  batches: [],
  products: [],
  cart: null,
  medicalRecords: [],
  currentMedicalRecord: null,
  prescriptions: [],
  dashboardData: null,
  currentReview: null,
  isLoading: false,
  error: null,

  fetchInventory: async (storeId) => {
    set({ isLoading: true });
    try {
      const inventory = await inventoryService.getInventory(storeId);
      set({ inventory, inventoryItems: inventory, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存失败', isLoading: false });
    }
  },

  fetchInventoryItems: async (storeId = 'store_001') => {
    set({ isLoading: true });
    try {
      const items = await inventoryService.getInventory(storeId);
      set({ inventory: items, inventoryItems: items, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存列表失败', isLoading: false });
    }
  },

  fetchInventoryAlerts: async (storeId) => {
    set({ isLoading: true });
    try {
      const alerts = await inventoryService.getInventoryAlerts(storeId);
      set({ inventoryAlerts: alerts, lowStockItems: alerts, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存预警失败', isLoading: false });
    }
  },

  fetchLowStockItems: async (storeId = 'store_001') => {
    set({ isLoading: true });
    try {
      const alerts = await inventoryService.getInventoryAlerts(storeId);
      set({ inventoryAlerts: alerts, lowStockItems: alerts, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取低库存列表失败', isLoading: false });
    }
  },

  fetchBatches: async (itemId) => {
    set({ isLoading: true });
    try {
      const batches = await inventoryService.getInventoryBatches(itemId);
      set({ batches, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取批次信息失败', isLoading: false });
    }
  },

  fetchProducts: async (category) => {
    set({ isLoading: true });
    try {
      const products = await inventoryService.getProducts(category);
      set({ products, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取商品列表失败', isLoading: false });
    }
  },

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await inventoryService.getCart();
      set({ cart, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取购物车失败', isLoading: false });
    }
  },

  addToCart: async (productId, quantity) => {
    set({ isLoading: true });
    try {
      await inventoryService.addToCart(productId, quantity);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加购物车失败', isLoading: false });
    }
  },

  submitPrescriptionReview: async (data) => {
    set({ isLoading: true });
    try {
      const review = await inventoryService.submitPrescriptionReview(data);
      set({ currentReview: review, isLoading: false });
      return review;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '提交审方失败', isLoading: false });
      throw err;
    }
  },

  fetchReviewStatus: async (id) => {
    set({ isLoading: true });
    try {
      const review = await inventoryService.getReviewStatus(id);
      set({ currentReview: review, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取审方状态失败', isLoading: false });
    }
  },

  fetchMedicalRecords: async (storeId = 'store_001') => {
    set({ isLoading: true });
    try {
      const records = await inventoryService.getMedicalRecords(storeId);
      set({ medicalRecords: records, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取病历列表失败', isLoading: false });
    }
  },

  createMedicalRecord: async (data) => {
    set({ isLoading: true });
    try {
      const record = await inventoryService.createMedicalRecord(data);
      set((state) => ({
        medicalRecords: [record, ...state.medicalRecords],
        isLoading: false,
      }));
      return record;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建病历失败', isLoading: false });
      throw err;
    }
  },

  signMedicalRecord: async (id, signature) => {
    set({ isLoading: true });
    try {
      const record = await inventoryService.signMedicalRecord(id, signature);
      set((state) => ({
        medicalRecords: state.medicalRecords.map((r) => (r.id === id ? record : r)),
        currentMedicalRecord: state.currentMedicalRecord?.id === id ? record : state.currentMedicalRecord,
        isLoading: false,
      }));
      return record;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '签署病历失败', isLoading: false });
      throw err;
    }
  },

  setCurrentMedicalRecord: (record) => {
    set({ currentMedicalRecord: record });
  },

  fetchDashboardData: async (storeId) => {
    set({ isLoading: true });
    try {
      const data = await storeDashboardService.getDashboardData(storeId);
      set({ dashboardData: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取工作台数据失败', isLoading: false });
    }
  },

  fetchPrescriptions: async (status) => {
    set({ isLoading: true });
    try {
      const prescriptions = await storeDashboardService.getPrescriptions(status);
      set({ prescriptions, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取处方列表失败', isLoading: false });
      set({ prescriptions: [] });
    }
  },

  reviewPrescription: async (id, approved, notes) => {
    set({ isLoading: true });
    try {
      await storeDashboardService.reviewPrescription(id, approved, notes);
      set((state) => ({
        prescriptions: state.prescriptions.map((p) =>
          p.id === id ? { ...p, status: approved ? 'approved' as any : 'rejected' as any, reviewNotes: notes } : p
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '审方失败', isLoading: false });
    }
  },

  updateStock: async (itemId, type, quantity, batchNo) => {
    set({ isLoading: true });
    try {
      set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === itemId
            ? { ...item, currentStock: type === 'in' ? item.currentStock + quantity : Math.max(0, item.currentStock - quantity) }
            : item
        ),
        inventoryItems: state.inventoryItems.map((item) =>
          item.id === itemId
            ? { ...item, currentStock: type === 'in' ? item.currentStock + quantity : Math.max(0, item.currentStock - quantity) }
            : item
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '库存更新失败', isLoading: false });
    }
  },
}));
