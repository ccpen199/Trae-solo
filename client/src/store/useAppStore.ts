import { create } from 'zustand'
import type { User, UserRole, Task, TaskUnit, Annotation, Settlement, Dispute, ProjectStats } from '../types'
import {
  mockCurrentUser,
  mockTasks,
  mockTaskUnits,
  mockSettlements,
  mockDisputes,
  mockProjectStats,
  mockAnnotators,
  mockReviewers,
} from '../data/mockData'

interface AppState {
  currentUser: User | null
  currentRole: UserRole
  tasks: Task[]
  currentTask: Task | null
  taskUnits: TaskUnit[]
  settlements: Settlement[]
  disputes: Dispute[]
  annotators: User[]
  reviewers: User[]
  projectStats: ProjectStats
  isLoading: boolean
  error: string | null

  setCurrentRole: (role: UserRole) => void
  setCurrentTask: (task: Task | null) => void
  getTaskById: (id: string) => Task | undefined
  getUnitsByTaskId: (taskId: string) => TaskUnit[]
  submitAnnotation: (unitId: string, annotation: Partial<Annotation>) => void
  addDispute: (dispute: Omit<Dispute, 'id' | 'status' | 'createdAt'>) => void
  resolveDispute: (disputeId: string, resolution: string, resolverId: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  currentRole: 'publisher',
  tasks: mockTasks,
  currentTask: null,
  taskUnits: mockTaskUnits,
  settlements: mockSettlements,
  disputes: mockDisputes,
  annotators: mockAnnotators,
  reviewers: mockReviewers,
  projectStats: mockProjectStats,
  isLoading: false,
  error: null,

  setCurrentRole: (role: UserRole) => set({ currentRole: role }),

  setCurrentTask: (task: Task | null) => set({ currentTask: task }),

  getTaskById: (id: string) => get().tasks.find(t => t.id === id),

  getUnitsByTaskId: (taskId: string) => get().taskUnits.filter(u => u.taskId === taskId),

  submitAnnotation: (unitId: string, annotation: Partial<Annotation>) => {
    set(state => ({
      taskUnits: state.taskUnits.map(unit => {
        if (unit.id === unitId) {
          const newAnnotation: Annotation = {
            id: `ann-${Date.now()}`,
            unitId,
            annotatorId: state.currentUser?.id || '',
            annotatorName: state.currentUser?.name || '',
            data: annotation.data || {},
            submittedAt: new Date().toISOString(),
            status: 'pending',
          }
          return {
            ...unit,
            status: 'completed',
            annotations: [...unit.annotations, newAnnotation],
          }
        }
        return unit
      }),
    }))
  },

  addDispute: (dispute) => {
    const newDispute: Dispute = {
      ...dispute,
      id: `d${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    }
    set(state => ({
      disputes: [newDispute, ...state.disputes],
    }))
  },

  resolveDispute: (disputeId: string, resolution: string, resolverId: string) => {
    set(state => ({
      disputes: state.disputes.map(d =>
        d.id === disputeId
          ? { ...d, status: 'resolved', resolution, resolverId }
          : d
      ),
    }))
  },
}))
