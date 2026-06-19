import { create } from 'zustand';
import type { Lawyer, LawyerVerifyStatus } from '../types';
import { mockLawyers, mockConsultations } from '../mock/data';

interface LawyerState {
  lawyers: Lawyer[];
  fetchLawyers: () => void;
  getLawyerById: (id: string) => Lawyer | undefined;
  getApprovedLawyers: () => Lawyer[];
  updateVerifyStatus: (lawyerId: string, status: LawyerVerifyStatus) => void;
  grabConsultation: (lawyerId: string, consultationId: string) => boolean;
  getLawyerStats: (
    lawyerId: string
  ) => { totalCases: number; avgRating: number; avgResponseTime: number };
}

export const useLawyerStore = create<LawyerState>((set, get) => ({
  lawyers: mockLawyers,
  fetchLawyers: () => {
    set({ lawyers: mockLawyers });
  },
  getLawyerById: (id: string) => {
    return get().lawyers.find((l) => l.id === id);
  },
  getApprovedLawyers: () => {
    return get().lawyers.filter((l) => l.verifyStatus === 'approved');
  },
  updateVerifyStatus: (lawyerId: string, status: LawyerVerifyStatus) => {
    set((state) => ({
      lawyers: state.lawyers.map((l) =>
        l.id === lawyerId
          ? {
              ...l,
              verifyStatus: status,
              ...(status === 'approved' && !l.verifiedAt
                ? { verifiedAt: new Date().toISOString() }
                : {}),
            }
          : l
      ),
    }));
  },
  grabConsultation: (lawyerId: string, consultationId: string) => {
    const lawyer = get().lawyers.find((l) => l.id === lawyerId);
    if (!lawyer || lawyer.verifyStatus !== 'approved') {
      return false;
    }
    const consultation = mockConsultations.find((c) => c.id === consultationId);
    if (!consultation || consultation.status !== 'pending') {
      return false;
    }
    set((state) => ({
      lawyers: state.lawyers.map((l) =>
        l.id === lawyerId ? { ...l, consultationCount: l.consultationCount + 1 } : l
      ),
    }));
    return true;
  },
  getLawyerStats: (lawyerId: string) => {
    const lawyer = get().lawyers.find((l) => l.id === lawyerId);
    if (!lawyer) {
      return { totalCases: 0, avgRating: 0, avgResponseTime: 0 };
    }
    const consultations = mockConsultations.filter((c) => c.lawyerId === lawyerId);
    return {
      totalCases: consultations.length || lawyer.consultationCount,
      avgRating: lawyer.averageRating,
      avgResponseTime: 0,
    };
  },
}));
