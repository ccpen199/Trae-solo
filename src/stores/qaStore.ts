import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface QAState {
  questions: any[]
  currentQuestion: any | null
  knowledgeGraph: any
  loading: boolean
  fetchQuestions: (filters?: any) => Promise<void>
  fetchQuestion: (id: number) => Promise<void>
  createQuestion: (data: any) => Promise<number>
  answerQuestion: (id: number, data: any) => Promise<void>
  fetchKnowledgeGraph: () => Promise<void>
  certifyAnswer: (questionId: number, answerId: number) => Promise<void>
}

export const useQAStore = create<QAState>((set, get) => ({
  questions: [],
  currentQuestion: null,
  knowledgeGraph: null,
  loading: false,

  fetchQuestions: async (filters?: any) => {
    set({ loading: true })
    try {
      const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
      const data = await apiFetch(`/qa${query}`)
      set({ questions: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  fetchQuestion: async (id: number) => {
    set({ loading: true })
    try {
      const data = await apiFetch(`/qa/${id}`)
      set({ currentQuestion: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  createQuestion: async (data: any) => {
    set({ loading: true })
    try {
      const result = await apiFetch('/qa', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      const r = result.data?.data || result.data || result
      return r.id || 0
    } finally {
      set({ loading: false })
    }
  },

  answerQuestion: async (id: number, data: any) => {
    set({ loading: true })
    try {
      await apiFetch(`/qa/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await get().fetchQuestion(id)
    } finally {
      set({ loading: false })
    }
  },

  fetchKnowledgeGraph: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch('/qa/knowledge-graph/data')
      set({ knowledgeGraph: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  certifyAnswer: async (questionId: number, answerId: number) => {
    set({ loading: true })
    try {
      await apiFetch(`/qa/${questionId}/certify`, {
        method: 'PUT',
        body: JSON.stringify({ answer_id: answerId }),
      })
      await get().fetchQuestion(questionId)
    } finally {
      set({ loading: false })
    }
  },
}))
