import { create } from 'zustand';
import type {
  Seat,
  Concession,
  Member,
  MemberTask,
  Order,
  RedeemItem,
  CartItem,
} from '@/types';

interface AppState {
  selectedSeats: Seat[];
  cartItems: CartItem[];
  currentMember: Member | null;
  memberTasks: MemberTask[];
  orders: Order[];
}

interface AppActions {
  selectSeat: (seat: Seat) => void;
  clearSeats: () => void;
  addToCart: (concession: Concession) => void;
  removeFromCart: (concessionId: string) => void;
  updateCartQuantity: (concessionId: string, quantity: number) => void;
  clearCart: () => void;
  completeTask: (taskId: string) => void;
  addOrder: (order: Order) => void;
  usePoints: (amount: number) => void;
  redeemPoints: (item: RedeemItem) => void;
}

type AppStore = AppState & AppActions;

const now = new Date();

export const useAppStore = create<AppStore>((set, get) => ({
  selectedSeats: [],
  cartItems: [],
  currentMember: {
    id: '1',
    userId: 'user-1',
    phone: '13800138000',
    nickname: '会员用户',
    avatar: '',
    level: 'Bronze',
    points: 1000,
    pendingPoints: 0,
    expiringPoints: 0,
    growthValue: 100,
    totalSpent: 500,
    totalOrders: 5,
    joinDate: now,
    isPACONNIEMember: true,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  },
  memberTasks: [],
  orders: [],

  selectSeat: (seat: Seat) => {
    set((state) => {
      const exists = state.selectedSeats.find((s) => s.id === seat.id);
      if (exists) {
        return {
          selectedSeats: state.selectedSeats.filter((s) => s.id !== seat.id),
        };
      }
      if (state.selectedSeats.length >= 4) {
        return state;
      }
      return {
        selectedSeats: [...state.selectedSeats, seat],
      };
    });
  },

  clearSeats: () => {
    set({ selectedSeats: [] });
  },

  addToCart: (concession: Concession) => {
    set((state) => {
      const existing = state.cartItems.find(
        (item) => item.concession.id === concession.id
      );
      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.concession.id === concession.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        cartItems: [...state.cartItems, { concession, quantity: 1 }],
      };
    });
  },

  removeFromCart: (concessionId: string) => {
    set((state) => ({
      cartItems: state.cartItems.filter(
        (item) => item.concession.id !== concessionId
      ),
    }));
  },

  updateCartQuantity: (concessionId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(concessionId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.concession.id === concessionId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ cartItems: [] });
  },

  completeTask: (taskId: string) => {
    set((state) => {
      const task = state.memberTasks.find((t) => t.id === taskId);
      if (!task || task.isCompleted) {
        return state;
      }
      return {
        memberTasks: state.memberTasks.map((t) =>
          t.id === taskId ? { ...t, isCompleted: true, isClaimed: true } : t
        ),
        currentMember: state.currentMember
          ? {
              ...state.currentMember,
              points: state.currentMember.points + task.points,
              growthValue: state.currentMember.growthValue + task.growthValue,
            }
          : state.currentMember,
      };
    });
  },

  addOrder: (order: Order) => {
    set((state) => ({
      orders: [order, ...state.orders],
    }));
  },

  usePoints: (amount: number) => {
    set((state) => {
      if (!state.currentMember || state.currentMember.points < amount) {
        return state;
      }
      return {
        currentMember: {
          ...state.currentMember,
          points: state.currentMember.points - amount,
        },
      };
    });
  },

  redeemPoints: (item: RedeemItem) => {
    set((state) => {
      if (
        !state.currentMember ||
        state.currentMember.points < item.pointsCost ||
        item.stock <= 0
      ) {
        return state;
      }
      return {
        currentMember: {
          ...state.currentMember,
          points: state.currentMember.points - item.pointsCost,
        },
      };
    });
  },
}));
