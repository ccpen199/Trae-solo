import { create } from "zustand";
import type { Task, User, Transaction } from "./types";
import { defaultUser, tasks as mockTasks, transactions as mockTransactions } from "./mock";

interface AppState {
  user: User;
  tasks: Task[];
  transactions: Transaction[];
  todayEarned: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completeTask: (taskId: string) => void;
  addCoins: (amount: number, desc: string) => void;
  withdraw: (amount: number) => boolean;
  checkin: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: defaultUser,
  tasks: mockTasks,
  transactions: mockTransactions,
  todayEarned: 1480,
  activeTab: "all",

  setActiveTab: (tab) => set({ activeTab: tab }),

  completeTask: (taskId) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task || task.status === "completed") return state;
      const updated = state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "completed" as const, progress: t.target } : t
      );
      return {
        tasks: updated,
        user: { ...state.user, coinBalance: state.user.coinBalance + task.coinReward },
        todayEarned: state.todayEarned + task.coinReward,
        transactions: [
          { id: `tx-${Date.now()}`, type: "earn", amount: task.coinReward, description: task.title, createdAt: new Date().toISOString(), status: "success" },
          ...state.transactions,
        ],
      };
    }),

  addCoins: (amount, desc) =>
    set((state) => ({
      user: { ...state.user, coinBalance: state.user.coinBalance + amount, totalEarned: state.user.totalEarned + amount },
      todayEarned: state.todayEarned + amount,
      transactions: [
        { id: `tx-${Date.now()}`, type: "earn", amount, description: desc, createdAt: new Date().toISOString(), status: "success" },
        ...state.transactions,
      ],
    })),

  withdraw: (amount) => {
    const state = get();
    if (amount > state.user.coinBalance) return false;
    set((s) => ({
      user: { ...s.user, coinBalance: s.user.coinBalance - amount, totalWithdrawn: s.user.totalWithdrawn + amount / 1000 },
      transactions: [
        { id: `tx-${Date.now()}`, type: "withdraw", amount, description: "提现至微信零钱", createdAt: new Date().toISOString(), status: "success" },
        ...s.transactions,
      ],
    }));
    return true;
  },

  checkin: () =>
    set((state) => {
      const today = new Date().toISOString().slice(0, 10);
      if (state.user.lastCheckin?.slice(0, 10) === today) return state;
      return {
        user: { ...state.user, checkinDays: state.user.checkinDays + 1, lastCheckin: new Date().toISOString(), coinBalance: state.user.coinBalance + 80 },
        todayEarned: state.todayEarned + 80,
        tasks: state.tasks.map((t) => (t.id === "t-checkin" ? { ...t, status: "completed" as const, progress: 1 } : t)),
        transactions: [
          { id: `tx-${Date.now()}`, type: "earn", amount: 80, description: "每日签到奖励", createdAt: new Date().toISOString(), status: "success" },
          ...state.transactions,
        ],
      };
    }),
}));
