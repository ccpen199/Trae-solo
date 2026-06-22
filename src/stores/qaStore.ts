import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface QAState {
  questions: any[]
  currentQuestion: any | null
  knowledgeGraph: any
  fetchQuestions: (filters?: any) => Promise<void>
  fetchQuestion: (id: number) => Promise<void>
  createQuestion: (data: any) => Promise<void>
  answerQuestion: (id: number, data: any) => Promise<void>
  fetchKnowledgeGraph: () => Promise<void>
}

export const useQAStore = create<QAState>((set) => ({
  questions: [],
  currentQuestion: null,
  knowledgeGraph: null,

  fetchQuestions: async (filters?: any) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const data = await apiFetch(`/qa/questions${query}`)
    set({ questions: data.questions || data })
  },

  fetchQuestion: async (id: number) => {
    const data = await apiFetch(`/qa/questions/${id}`)
    set({ currentQuestion: data.question || data })
  },

  createQuestion: async (data: any) => {
    await apiFetch('/qa/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  answerQuestion: async (id: number, data: any) => {
    await apiFetch(`/qa/questions/${id}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  fetchKnowledgeGraph: async () => {
    const data = await apiFetch('/qa/knowledge-graph')
    set({ knowledgeGraph: data.graph || data })
  },
}))
