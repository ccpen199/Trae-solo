import { create } from 'zustand'
import type { Consultation, LegalCaseType, ConsultationStatus } from '@/types'
import { mockApi } from '@/mock/api'

interface ConsultationState {
  consultations: Consultation[]
  currentConsultation: Consultation | null
  grabPool: Consultation[]
  fetchConsultations: (userId?: string, lawyerId?: string, status?: ConsultationStatus) => Promise<void>
  fetchGrabPool: () => Promise<void>
  createConsultation: (data: {
    userId: string
    caseType: LegalCaseType
    title: string
    description: string
    region: string
    assignedLawyerId?: string
  }) => Promise<Consultation | null>
  getConsultation: (id: string) => Promise<Consultation | null>
  grabCase: (caseId: string, lawyerId: string) => Promise<Consultation | null>
  closeConsultation: (id: string) => Promise<Consultation | null>
}

export const useConsultationStore = create<ConsultationState>()((set) => ({
  consultations: [],
  currentConsultation: null,
  grabPool: [],

  fetchConsultations: async (userId, lawyerId, status) => {
    const consultations = await mockApi.getConsultationList({ userId, lawyerId, status })
    set({ consultations })
  },

  fetchGrabPool: async () => {
    const grabPool = await mockApi.getGrabPool()
    set({ grabPool })
  },

  createConsultation: async (data) => {
    try {
      const newConsultation = await mockApi.createConsultation(data)
      set((state) => ({
        consultations: [newConsultation, ...state.consultations],
      }))
      return newConsultation
    } catch {
      return null
    }
  },

  getConsultation: async (id) => {
    const consultation = await mockApi.getConsultationDetail(id)
    if (consultation) {
      set({ currentConsultation: consultation })
    }
    return consultation || null
  },

  grabCase: async (caseId, lawyerId) => {
    try {
      const result = await mockApi.grabConsultation(caseId, lawyerId)
      set((state) => ({
        grabPool: state.grabPool.filter((c) => c.id !== caseId),
        consultations: state.consultations.map((c) =>
          c.id === caseId ? result : c
        ),
        currentConsultation:
          state.currentConsultation?.id === caseId ? result : state.currentConsultation,
      }))
      return result
    } catch {
      return null
    }
  },

  closeConsultation: async (id) => {
    const consultation = await mockApi.getConsultationDetail(id)
    if (!consultation) return null
    try {
      await mockApi.createEvaluation({
        consultationId: id,
        userId: consultation.userId,
        lawyerId: consultation.lawyerId || '',
        rating: 5,
      })
      const updated = await mockApi.getConsultationDetail(id)
      if (updated) {
        set((state) => ({
          consultations: state.consultations.map((c) =>
            c.id === id ? updated : c
          ),
          currentConsultation:
            state.currentConsultation?.id === id ? updated : state.currentConsultation,
        }))
      }
      return updated || null
    } catch {
      return null
    }
  },
}))
