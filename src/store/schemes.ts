import { create } from 'zustand'
import {
  schemes as schemesApi,
  steps as stepsApi,
  comments as commentsApi,
  decisions as decisionsApi,
  changes as changesApi,
  retrospective as retrospectiveApi,
} from '@/api/client'
import type {
  Scheme,
  Step,
  Comment,
  Decision,
  Change,
  IssueTypeCount,
  SchemeRound,
  IssueWithComments,
} from '@/types'
import {
  schemeStatusLabels,
  stepStatusLabels,
  issueTypeLabels,
  syncStatusLabels,
} from '@/types'

export { schemeStatusLabels, stepStatusLabels, issueTypeLabels, syncStatusLabels }

export interface SchemesState {
  schemes: Scheme[]
  currentScheme: Scheme | null
  steps: Step[]
  comments: Record<number, Comment[]>
  decisions: Decision[]
  changes: Change[]
  loading: boolean
  fetchSchemes: () => Promise<void>
  fetchScheme: (id: number) => Promise<void>
  createScheme: (data: Partial<Scheme>) => Promise<Scheme>
  updateScheme: (id: number, data: Partial<Scheme>) => Promise<Scheme>
  fetchSteps: (schemeId: number) => Promise<void>
  createStep: (schemeId: number, data: Partial<Step>) => Promise<Step>
  updateStep: (schemeId: number, stepId: number, data: Partial<Step>) => Promise<Step>
  fetchComments: (stepId: number) => Promise<void>
  createComment: (stepId: number, data: { content: string; issueType?: string }) => Promise<Comment>
  resolveComment: (commentId: number) => Promise<void>
  fetchDecisions: (schemeId: number) => Promise<void>
  createDecision: (schemeId: number, data: Partial<Decision>) => Promise<Decision>
  fetchChanges: (schemeId: number) => Promise<void>
  createChange: (schemeId: number, data: Partial<Change>) => Promise<Change>
  getIssues: () => Promise<IssueWithComments>
  getRounds: () => Promise<SchemeRound[]>
  getRisks: () => Promise<Comment[]>
  getFeedback: () => Promise<Comment[]>
}

export const useSchemesStore = create<SchemesState>((set) => ({
  schemes: [],
  currentScheme: null,
  steps: [],
  comments: {},
  decisions: [],
  changes: [],
  loading: false,

  fetchSchemes: async () => {
    set({ loading: true })
    try {
      const schemes = await schemesApi.listSchemes()
      set({ schemes, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchScheme: async (id: number) => {
    set({ loading: true })
    try {
      const scheme = await schemesApi.getScheme(id)
      set({ currentScheme: scheme, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createScheme: async (data: Partial<Scheme>) => {
    set({ loading: true })
    try {
      const newScheme = await schemesApi.createScheme(data)
      set((state) => ({
        schemes: [...state.schemes, newScheme],
        loading: false,
      }))
      return newScheme
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateScheme: async (id: number, data: Partial<Scheme>) => {
    set({ loading: true })
    try {
      const updatedScheme = await schemesApi.updateScheme(id, data)
      set((state) => ({
        schemes: state.schemes.map((s) => (s.id === id ? updatedScheme : s)),
        currentScheme: state.currentScheme?.id === id ? updatedScheme : state.currentScheme,
        loading: false,
      }))
      return updatedScheme
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchSteps: async (schemeId: number) => {
    set({ loading: true })
    try {
      const steps = await stepsApi.listSteps(schemeId)
      set({ steps, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createStep: async (schemeId: number, data: Partial<Step>) => {
    set({ loading: true })
    try {
      const newStep = await stepsApi.createStep(schemeId, data)
      set((state) => ({
        steps: [...state.steps, newStep].sort((a, b) => a.step_order - b.step_order),
        loading: false,
      }))
      return newStep
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateStep: async (schemeId: number, stepId: number, data: Partial<Step>) => {
    set({ loading: true })
    try {
      const updatedStep = await stepsApi.updateStep(schemeId, stepId, data)
      set((state) => ({
        steps: state.steps.map((s) => (s.id === stepId ? updatedStep : s)),
        loading: false,
      }))
      return updatedStep
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchComments: async (stepId: number) => {
    set({ loading: true })
    try {
      const comments = await commentsApi.listComments(stepId)
      set((state) => ({
        comments: { ...state.comments, [stepId]: comments },
        loading: false,
      }))
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createComment: async (stepId: number, data: { content: string; issueType?: string }) => {
    set({ loading: true })
    try {
      const newComment = await commentsApi.createComment(stepId, data)
      set((state) => {
        const existing = state.comments[stepId] || []
        return {
          comments: { ...state.comments, [stepId]: [...existing, newComment] },
          loading: false,
        }
      })
      return newComment
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  resolveComment: async (commentId: number) => {
    set({ loading: true })
    try {
      await commentsApi.updateComment(commentId, { resolved: 1 })
      set((state) => {
        const newComments = { ...state.comments }
        Object.keys(newComments).forEach((key) => {
          const stepId = Number(key)
          newComments[stepId] = newComments[stepId].map((c) =>
            c.id === commentId ? { ...c, resolved: 1 } : c
          )
        })
        return { comments: newComments, loading: false }
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchDecisions: async (schemeId: number) => {
    set({ loading: true })
    try {
      const decisions = await decisionsApi.listDecisions(schemeId)
      set({ decisions, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createDecision: async (schemeId: number, data: Partial<Decision>) => {
    set({ loading: true })
    try {
      const newDecision = await decisionsApi.createDecision(schemeId, data)
      set((state) => ({
        decisions: [newDecision, ...state.decisions],
        loading: false,
      }))
      return newDecision
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchChanges: async (schemeId: number) => {
    set({ loading: true })
    try {
      const changes = await changesApi.listChanges(schemeId)
      set({ changes, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createChange: async (schemeId: number, data: Partial<Change>) => {
    set({ loading: true })
    try {
      const newChange = await changesApi.createChange(schemeId, data)
      set((state) => ({
        changes: [newChange, ...state.changes],
        loading: false,
      }))
      return newChange
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  getIssues: async () => {
    return retrospectiveApi.getIssues()
  },

  getRounds: async () => {
    return retrospectiveApi.getRounds()
  },

  getRisks: async () => {
    return retrospectiveApi.getRisks()
  },

  getFeedback: async () => {
    return retrospectiveApi.getFeedback()
  },
}))
