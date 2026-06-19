import { create } from 'zustand';
import type { Consultation, ConsultationStatus } from '../types';
import { mockConsultations } from '../mock/data';

interface ConsultationState {
  consultations: Consultation[];
  loading: boolean;
  fetchConsultations: () => void;
  getConsultationById: (id: string) => Consultation | undefined;
  createConsultation: (data: Partial<Consultation>) => void;
  updateConsultationStatus: (id: string, status: ConsultationStatus) => void;
  assignLawyer: (consultationId: string, lawyerId: string) => void;
  getPendingConsultations: () => Consultation[];
  getConsultationsByUser: (userId: string) => Consultation[];
  getConsultationsByLawyer: (lawyerId: string) => Consultation[];
}

const now = () => new Date().toISOString();

export const useConsultationStore = create<ConsultationState>((set, get) => ({
  consultations: mockConsultations,
  loading: false,
  fetchConsultations: () => {
    set({ loading: true });
    setTimeout(() => {
      set({ consultations: mockConsultations, loading: false });
    }, 300);
  },
  getConsultationById: (id: string) => {
    return get().consultations.find((c) => c.id === id);
  },
  createConsultation: (data: Partial<Consultation>) => {
    const newConsultation: Consultation = {
      id: `consultation-${Date.now()}`,
      userId: data.userId || '',
      category: data.category || 'other',
      title: data.title || '',
      description: data.description || '',
      urgency: data.urgency || 'medium',
      status: 'pending',
      evidenceFiles: data.evidenceFiles || [],
      createdAt: now(),
      updatedAt: now(),
      ...data,
    };
    set((state) => ({
      consultations: [...state.consultations, newConsultation],
    }));
  },
  updateConsultationStatus: (id: string, status: ConsultationStatus) => {
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              updatedAt: now(),
              ...(status === 'matched' && !c.matchedAt ? { matchedAt: now() } : {}),
              ...(status === 'closed' && !c.closedAt ? { closedAt: now() } : {}),
              ...(status === 'reviewed' && !c.reviewedAt ? { reviewedAt: now() } : {}),
            }
          : c
      ),
    }));
  },
  assignLawyer: (consultationId: string, lawyerId: string) => {
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.id === consultationId
          ? { ...c, lawyerId, status: 'matched', matchedAt: now(), updatedAt: now() }
          : c
      ),
    }));
  },
  getPendingConsultations: () => {
    return get().consultations.filter((c) => c.status === 'pending');
  },
  getConsultationsByUser: (userId: string) => {
    return get().consultations.filter((c) => c.userId === userId);
  },
  getConsultationsByLawyer: (lawyerId: string) => {
    return get().consultations.filter((c) => c.lawyerId === lawyerId);
  },
}));
