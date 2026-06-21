import { create } from 'zustand';
import { 
  CaseSource, CaseBid, Task, WorkCase, 
  PaginationParams, PaginationResult 
} from '@/types';
import { caseApi } from '@/services/cases';
import { workspaceApi } from '@/services/workspace';

interface CaseState {
  // 案源市场
  caseList: PaginationResult<CaseSource> | null;
  caseDetail: CaseSource | null;
  myCases: CaseSource[];
  myBids: CaseBid[];
  matchedCases: CaseSource[];
  
  // 办案中台
  workCases: PaginationResult<WorkCase> | null;
  workCaseDetail: WorkCase | null;
  tasks: Task[];
  
  loading: boolean;
  
  // 案源方法
  fetchCaseList: (params?: any) => Promise<void>;
  fetchCaseDetail: (id: string) => Promise<CaseSource>;
  fetchMatchedCases: () => Promise<void>;
  fetchMyCases: () => Promise<void>;
  fetchMyBids: () => Promise<void>;
  setCaseDetail: (caseSource: CaseSource | null) => void;
  
  // 办案方法
  fetchWorkCases: (params?: any) => Promise<void>;
  fetchWorkCaseDetail: (id: string) => Promise<WorkCase>;
  fetchTasks: (params?: any) => Promise<void>;
  fetchAllTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  
  reset: () => void;
}

export const useCaseStore = create<CaseState>((set, get) => ({
  caseList: null,
  caseDetail: null,
  myCases: [],
  myBids: [],
  matchedCases: [],
  workCases: null,
  workCaseDetail: null,
  tasks: [],
  loading: false,

  fetchCaseList: async (params) => {
    set({ loading: true });
    try {
      const result = await caseApi.getCaseList(params);
      set({ caseList: result, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchCaseDetail: async (id) => {
    set({ loading: true });
    try {
      const caseSource = await caseApi.getCaseDetail(id);
      set({ caseDetail: caseSource, loading: false });
      return caseSource;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchMatchedCases: async () => {
    set({ loading: true });
    try {
      const cases = await caseApi.getMatchedCases();
      set({ matchedCases: cases, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchMyCases: async () => {
    set({ loading: true });
    try {
      const cases = await caseApi.getMyPublishedCases();
      set({ myCases: cases, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchMyBids: async () => {
    set({ loading: true });
    try {
      const bids = await caseApi.getMyBids();
      set({ myBids: bids, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setCaseDetail: (caseSource) => {
    set({ caseDetail: caseSource });
  },

  fetchWorkCases: async (params) => {
    set({ loading: true });
    try {
      const result = await workspaceApi.getCaseList(params);
      set({ workCases: result, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchWorkCaseDetail: async (id) => {
    set({ loading: true });
    try {
      const workCase = await workspaceApi.getCaseDetail(id);
      set({ workCaseDetail: workCase, loading: false });
      return workCase;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchTasks: async (params) => {
    set({ loading: true });
    try {
      const result = await workspaceApi.getTaskList(params);
      set({ tasks: result.items, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchAllTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await workspaceApi.getAllTasks();
      set({ tasks, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      await workspaceApi.updateTaskStatus({ taskId, status: status as any });
      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, status: status as any, updatedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (error) {
      throw error;
    }
  },

  reset: () => {
    set({
      caseDetail: null,
      workCaseDetail: null,
    });
  },
}));
