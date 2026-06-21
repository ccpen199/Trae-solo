import { create } from 'zustand';
import type { RealtimeBoxOffice, FilmRankItem, PipelineStatus } from 'shared/types';
import {
  generateRealtimeBoxOffice,
  generateFilmRank,
  generatePipelineStatus,
} from 'shared/mock-generator';

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
  boxOffice: RealtimeBoxOffice;
  ranking: FilmRankItem[];
  pipelines: PipelineStatus[];
  lastUpdate: string;
  error: string | null;
  setSidebarCollapsed: (v: boolean) => void;
  setCurrentRoute: (r: string) => void;
  setBoxOffice: (d: RealtimeBoxOffice) => void;
  setRanking: (d: FilmRankItem[]) => void;
  setPipelines: (d: PipelineStatus[]) => void;
  refreshAll: () => Promise<void>;
}

const fetchJson = async <T>(url: string, fallback: () => T): Promise<T> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.data ?? fallback()) as T;
  } catch {
    return fallback();
  }
};

const defaultBO = generateRealtimeBoxOffice();
const defaultRank = generateFilmRank();
const defaultPipes = generatePipelineStatus();

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
  boxOffice: defaultBO,
  ranking: defaultRank,
  pipelines: defaultPipes,
  lastUpdate: defaultBO.updateTime,
  error: null,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCurrentRoute: (r) => set({ currentRoute: r }),
  setBoxOffice: (d) => set({ boxOffice: d, lastUpdate: d.updateTime }),
  setRanking: (d) => set({ ranking: d }),
  setPipelines: (d) => set({ pipelines: d }),
  refreshAll: async () => {
    try {
      const [bo, rank, pipes] = await Promise.all([
        fetchJson<RealtimeBoxOffice>('/api/boxoffice/realtime', generateRealtimeBoxOffice),
        fetchJson<FilmRankItem[]>('/api/boxoffice/ranking?limit=10', generateFilmRank),
        fetchJson<PipelineStatus[]>('/api/pipeline/status', generatePipelineStatus),
      ]);
      set({
        boxOffice: bo,
        ranking: rank,
        pipelines: pipes,
        lastUpdate: bo.updateTime,
        error: null,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
  },
}));
