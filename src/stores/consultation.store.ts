import { create } from 'zustand';
import type { Consultation, ConsultationStatus, ConsultationDraft, DispatchBasis } from '../types';
import { mockConsultationsWithExtra, mockDrafts, generateDispatchBasis } from '../mock/data';

interface ConsultationState {
  consultations: Consultation[];
  drafts: ConsultationDraft[];
  loading: boolean;
  fetchConsultations: () => void;
  fetchDrafts: () => void;
  getConsultationById: (id: string) => Consultation | undefined;
  getDraftById: (id: string) => ConsultationDraft | undefined;
  getConsultationsByUser: (userId: string) => Consultation[];
  getDraftsByUser: (userId: string) => ConsultationDraft[];
  getPendingConsultations: () => Consultation[];
  getConsultationsByStatus: (status: ConsultationStatus) => Consultation[];
  createConsultation: (data: Partial<Consultation>) => void;
  createDraft: (data: Partial<ConsultationDraft>) => ConsultationDraft;
  updateDraft: (id: string, data: Partial<ConsultationDraft>) => void;
  deleteDraft: (id: string) => void;
  updateConsultationStatus: (id: string, status: ConsultationStatus) => void;
  assignLawyer: (consultationId: string, lawyerId: string) => void;
  getOrCreateDispatchBasis: (consultationId: string) => DispatchBasis | undefined;
  getConsultationsByLawyer: (lawyerId: string) => Consultation[];
}

const now = () => new Date().toISOString();

export const useConsultationStore = create<ConsultationState>((set, get) => ({
  consultations: mockConsultationsWithExtra,
  drafts: mockDrafts,
  loading: false,
  fetchConsultations: () => {
    set({ loading: true });
    setTimeout(() => {
      set({ consultations: mockConsultationsWithExtra, loading: false });
    }, 300);
  },
  fetchDrafts: () => {
    set({ loading: true });
    setTimeout(() => {
      set({ drafts: mockDrafts, loading: false });
    }, 300);
  },
  getConsultationById: (id: string) => {
    return get().consultations.find((c) => c.id === id);
  },
  getDraftById: (id: string) => {
    return get().drafts.find((d) => d.id === id);
  },
  getConsultationsByUser: (userId: string) => {
    return get().consultations.filter((c) => c.userId === userId);
  },
  getDraftsByUser: (userId: string) => {
    return get().drafts.filter((d) => d.userId === userId);
  },
  getPendingConsultations: () => {
    return get().consultations.filter((c) => c.status === 'pending');
  },
  getConsultationsByStatus: (status: ConsultationStatus) => {
    return get().consultations.filter((c) => c.status === status);
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
  createDraft: (data: Partial<ConsultationDraft>) => {
    const timestamp = Date.now();
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const seq = String(get().drafts.length + 1).padStart(4, '0');
    const newDraft: ConsultationDraft = {
      id: `draft-${timestamp}`,
      userId: data.userId || '',
      draftNumber: `DR${dateStr}${seq}`,
      evidenceFiles: data.evidenceFiles || [],
      createdAt: now(),
      updatedAt: now(),
      ...data,
    };
    set((state) => ({
      drafts: [...state.drafts, newDraft],
    }));
    return newDraft;
  },
  updateDraft: (id: string, data: Partial<ConsultationDraft>) => {
    set((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === id ? { ...d, ...data, updatedAt: now() } : d
      ),
    }));
  },
  deleteDraft: (id: string) => {
    set((state) => ({
      drafts: state.drafts.filter((d) => d.id !== id),
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
  getOrCreateDispatchBasis: (consultationId: string) => {
    const consultation = get().consultations.find((c) => c.id === consultationId);
    if (!consultation) return undefined;
    if (consultation.dispatchBasis) {
      return consultation.dispatchBasis;
    }
    const basis = generateDispatchBasis(consultation);
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.id === consultationId ? { ...c, dispatchBasis: basis } : c
      ),
    }));
    return basis;
  },
  getConsultationsByLawyer: (lawyerId: string) => {
    return get().consultations.filter((c) => c.lawyerId === lawyerId);
  },
}));
