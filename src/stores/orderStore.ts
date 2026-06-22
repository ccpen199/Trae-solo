import { create } from 'zustand';
import type { Order } from '@/types';

interface OrderState {
  publishDraft: Partial<Order>;
  currentTrackingOrderId: string | null;
  setPublishDraft: (partial: Partial<Order>) => void;
  clearPublishDraft: () => void;
  setCurrentTrackingOrder: (id: string | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  publishDraft: {},
  currentTrackingOrderId: null,

  setPublishDraft: (partial) =>
    set((state) => ({
      publishDraft: { ...state.publishDraft, ...partial },
    })),

  clearPublishDraft: () => set({ publishDraft: {} }),

  setCurrentTrackingOrder: (id) => set({ currentTrackingOrderId: id }),
}));

export default useOrderStore;
