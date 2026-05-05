import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  erpId: string;
  name: string;
  branchId: number;
  branchName: string;
  isHeadquarters: boolean;
  positionId: number;
  positionName: string;
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'scheduling-auth-storage',
    }
  )
);

interface LockedOrder {
  id: number;
  orderId: number;
  orderNo: string;
  orderType: string;
  receiverName: string;
  receiverPhone: string;
  receiverLandline: string | null;
  appointmentDate: string;
  appointmentTime: string;
  itemCount: number;
  volume: number;
  weight: number;
  dcName: string;
  warehouseName: string;
  batchId: string;
  lockedAt: string;
  expiresAt: string;
  editing: boolean;
}

interface SchedulingState {
  batchId: string | null;
  lockedOrders: LockedOrder[];
  sessionExpiresAt: string | null;
  setBatch: (batchId: string, orders: any[], sessionDuration: number) => void;
  updateOrder: (orderId: number, updates: Partial<LockedOrder>) => void;
  removeOrder: (orderId: number) => void;
  clearBatch: () => void;
}

export const useSchedulingStore = create<SchedulingState>()(
  (set, get) => ({
    batchId: null,
    lockedOrders: [],
    sessionExpiresAt: null,
    setBatch: (batchId, orders, sessionDuration) => {
      const expiresAt = new Date(Date.now() + sessionDuration * 60 * 1000).toISOString();
      const mappedOrders: LockedOrder[] = orders.map((o: any) => ({
        id: o.lockId || o.id,
        orderId: o.order_id || o.id,
        orderNo: o.orderNo || o.order_no || '',
        orderType: o.orderType || o.order_type || '',
        receiverName: o.receiverName || o.receiver_name || '',
        receiverPhone: o.receiverPhone || o.receiver_phone || '',
        receiverLandline: o.receiverLandline || o.receiver_landline || '',
        appointmentDate: o.appointmentDate || o.appointment_date || '',
        appointmentTime: o.appointmentTime || o.appointment_time || '',
        itemCount: o.itemCount || o.item_count || 0,
        volume: o.volume || 0,
        weight: o.weight || 0,
        dcName: o.dcName || o.dc_name || '',
        warehouseName: o.warehouseName || o.warehouse_name || '',
        batchId: o.batchId || o.batch_id || batchId,
        lockedAt: o.lockedAt || o.locked_at || new Date().toISOString(),
        expiresAt: o.expiresAt || o.expires_at || expiresAt,
        editing: false,
      }));
      set({ batchId, lockedOrders: mappedOrders, sessionExpiresAt: expiresAt });
    },
    updateOrder: (orderId, updates) => {
      set((state) => ({
        lockedOrders: state.lockedOrders.map((o) =>
          o.orderId === orderId ? { ...o, ...updates } : o
        ),
      }));
    },
    removeOrder: (orderId) => {
      set((state) => ({
        lockedOrders: state.lockedOrders.filter((o) => o.orderId !== orderId),
      }));
    },
    clearBatch: () => {
      set({ batchId: null, lockedOrders: [], sessionExpiresAt: null });
    },
  })
);
