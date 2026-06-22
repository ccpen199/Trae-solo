import { create } from 'zustand';

interface FusedOrder {
  orderId: string;
  fusedAt: Date;
  reason: string;
  prevRiders: string[];
}

interface DispatchState {
  selectedOrderId: string | null;
  selectedRiderId: string | null;
  alertOrders: string[];
  fusedOrders: FusedOrder[];
  selectOrder: (id: string | null) => void;
  selectRider: (id: string | null) => void;
  addAlertOrder: (id: string) => void;
  removeAlertOrder: (id: string) => void;
  addFusedOrder: (orderId: string, reason: string, prevRiders: string[]) => void;
}

export const useDispatchStore = create<DispatchState>((set) => ({
  selectedOrderId: null,
  selectedRiderId: null,
  alertOrders: [],
  fusedOrders: [],

  selectOrder: (id) => set({ selectedOrderId: id }),

  selectRider: (id) => set({ selectedRiderId: id }),

  addAlertOrder: (id) =>
    set((state) =>
      state.alertOrders.includes(id)
        ? state
        : { alertOrders: [...state.alertOrders, id] }
    ),

  removeAlertOrder: (id) =>
    set((state) => ({
      alertOrders: state.alertOrders.filter((orderId) => orderId !== id),
    })),

  addFusedOrder: (orderId, reason, prevRiders) =>
    set((state) => ({
      fusedOrders: [
        ...state.fusedOrders,
        {
          orderId,
          fusedAt: new Date(),
          reason,
          prevRiders,
        },
      ],
    })),
}));

export default useDispatchStore;
