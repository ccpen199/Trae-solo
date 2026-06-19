import { create } from 'zustand';
import type { ServiceEvaluation, MonitorStats, DisputeStage, Lawyer } from '../types';
import { mockEvaluations, mockMonitorStats, mockLawyers } from '../mock/data';

interface AdminState {
  evaluations: ServiceEvaluation[];
  monitorStats: MonitorStats | null;
  fetchEvaluations: () => void;
  fetchMonitorStats: () => void;
  updateDisputeStage: (evaluationId: string, stage: DisputeStage) => void;
  getZeroResponseLawyers: () => Lawyer[];
  freezeLawyer: (lawyerId: string) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  evaluations: mockEvaluations,
  monitorStats: null,
  fetchEvaluations: () => {
    set({ evaluations: mockEvaluations });
  },
  fetchMonitorStats: () => {
    set({ monitorStats: mockMonitorStats });
  },
  updateDisputeStage: (evaluationId: string, stage: DisputeStage) => {
    set((state) => ({
      evaluations: state.evaluations.map((e) =>
        e.id === evaluationId
          ? {
              ...e,
              disputeStage: stage,
              ...(stage === 'resolved' && !e.resolvedAt
                ? { resolvedAt: new Date().toISOString() }
                : {}),
              ...(stage !== 'evaluation' && !e.disputedAt
                ? { disputedAt: new Date().toISOString() }
                : {}),
            }
          : e
      ),
    }));
  },
  getZeroResponseLawyers: () => {
    return mockLawyers.filter((l) => l.verifyStatus === 'frozen');
  },
  freezeLawyer: (lawyerId: string) => {
    set((state) => ({
      evaluations: state.evaluations,
    }));
  },
}));
