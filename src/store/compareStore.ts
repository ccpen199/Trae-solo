import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareHistoryItem {
  id: string;
  time: string;
  items: { id: number; name: string }[];
}

interface CompareState {
  compareIds: number[];
  history: CompareHistoryItem[];
  addId: (id: number, name?: string) => { success: boolean; msg: string };
  removeId: (id: number) => void;
  clear: () => void;
  setIds: (ids: number[]) => void;
  saveHistory: (names: { id: number; name: string }[]) => void;
  clearHistory: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareIds: [],
      history: [],

      addId: (id: number) => {
        const { compareIds } = get();
        if (compareIds.includes(id)) {
          return { success: false, msg: '该对象已在对比列表中' };
        }
        if (compareIds.length >= 4) {
          return { success: false, msg: '最多只能对比4个对象' };
        }
        set({ compareIds: [...compareIds, id] });
        return { success: true, msg: '' };
      },

      removeId: (id: number) => {
        set({ compareIds: get().compareIds.filter(i => i !== id) });
      },

      clear: () => set({ compareIds: [] }),

      setIds: (ids: number[]) => set({ compareIds: ids.slice(0, 4) }),

      saveHistory: (names: { id: number; name: string }[]) => {
        const item: CompareHistoryItem = {
          id: Date.now().toString(),
          time: new Date().toLocaleString('zh-CN'),
          items: names,
        };
        set({ history: [item, ...get().history].slice(0, 5) });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'trusted-eval-compare',
    }
  )
);
