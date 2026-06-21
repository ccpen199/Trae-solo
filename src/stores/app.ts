import { create } from 'zustand';
import type { RealtimeBoxOffice, FilmRankItem, PipelineStatus } from '../../shared/types';

interface UserState {
  userId: string;
  userName: string;
  userRole: string;
  orgName: string;
  permissionLevel: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  currentRoute: string;
  user: UserState;
  boxOffice: RealtimeBoxOffice | null;
  ranking: FilmRankItem[];
  pipelines: PipelineStatus[];
  lastUpdate: string;
  setSidebarCollapsed: (v: boolean) => void;
  setCurrentRoute: (r: string) => void;
  setBoxOffice: (d: RealtimeBoxOffice) => void;
  setRanking: (d: FilmRankItem[]) => void;
  setPipelines: (d: PipelineStatus[]) => void;
  refreshAll: () => Promise<void>;
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  const json = await res.json();
  return json.data as T;
};

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  currentRoute: '/',
  user: {
    userId: 'U00001',
    userName: '陈明远',
    userRole: '发行总监',
    orgName: '华光影业',
    permissionLevel: '企业定制版',
  },
  boxOffice: null,
  ranking: [],
  pipelines: [],
  lastUpdate: '-',
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCurrentRoute: (r) => set({ currentRoute: r }),
  setBoxOffice: (d) => set({ boxOffice: d, lastUpdate: d.updateTime }),
  setRanking: (d) => set({ ranking: d }),
  setPipelines: (d) => set({ pipelines: d }),
  refreshAll: async () => {
    try {
      const [bo, rank, pipes] = await Promise.all([
        fetchJson<RealtimeBoxOffice>('/api/boxoffice/realtime'),
        fetchJson<FilmRankItem[]>('/api/boxoffice/ranking?limit=10'),
        fetchJson<PipelineStatus[]>('/api/pipeline/status'),
      ]);
      set({
        boxOffice: bo,
        ranking: rank,
        pipelines: pipes,
        lastUpdate: bo.updateTime,
      });
    } catch (e) {
      console.error('Refresh failed:', e);
    }
  },
}));
