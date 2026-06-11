import { create } from 'zustand'
import type { Task, TaskSubmission, UserRole, DifficultyLevel, AcceptancePeriod } from '@/types'
import { tasks as mockTasks, submissions as mockSubmissions } from '@/data'
import { currentWorker } from '@/data/users'

const initialAcceptedTaskIds = [
  'T017',
  'T004',
  'T009',
]

interface AppState {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void

  tasks: Task[]
  submissions: TaskSubmission[]

  acceptedTaskIds: string[]
  acceptTask: (taskId: string) => void
  submitTask: (taskId: string) => void

  difficultyFilter: DifficultyLevel | 'all'
  setDifficultyFilter: (filter: DifficultyLevel | 'all') => void
  acceptancePeriodFilter: AcceptancePeriod | 'all'
  setAcceptancePeriodFilter: (filter: AcceptancePeriod | 'all') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: 'heat' | 'price' | 'newest'
  setSortBy: (sort: 'heat' | 'price' | 'newest') => void

  approveSubmission: (submissionId: string) => void
  rejectSubmission: (submissionId: string, notes: string) => void

  approveCompliance: (taskId: string) => void
  rejectCompliance: (taskId: string, notes: string) => void

  resolveAlert: (alertId: string) => void
  resolvedAlertIds: string[]
}

export const useStore = create<AppState>((set) => ({
  currentRole: 'worker',
  setCurrentRole: (role) => set({ currentRole: role }),

  tasks: mockTasks,
  submissions: mockSubmissions,

  acceptedTaskIds: initialAcceptedTaskIds,
  acceptTask: (taskId) =>
    set((state) => ({
      acceptedTaskIds: state.acceptedTaskIds.includes(taskId)
        ? state.acceptedTaskIds
        : [...state.acceptedTaskIds, taskId],
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, takenSlots: t.takenSlots + 1 } : t
      ),
    })),

  submitTask: (taskId) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return state
      const multiplier = currentWorker.completedTasks >= 50 ? 1.3
        : currentWorker.completedTasks >= 20 ? 1.2
        : currentWorker.completedTasks >= 10 ? 1.15
        : currentWorker.completedTasks >= 5 ? 1.08 : 1
      const newSubmission: TaskSubmission = {
        id: `SUB-${Date.now()}`,
        taskId: task.id,
        taskTitle: task.title,
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        attachments: ['uploaded_screenshot.png'],
        status: 'submitted',
        price: +(task.currentPrice * multiplier).toFixed(2),
        submittedAt: new Date().toISOString(),
      }
      return {
        submissions: [newSubmission, ...state.submissions],
        acceptedTaskIds: state.acceptedTaskIds.filter((id) => id !== taskId),
      }
    }),

  difficultyFilter: 'all',
  setDifficultyFilter: (filter) => set({ difficultyFilter: filter }),
  acceptancePeriodFilter: 'all',
  setAcceptancePeriodFilter: (filter) => set({ acceptancePeriodFilter: filter }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  sortBy: 'heat',
  setSortBy: (sort) => set({ sortBy: sort }),

  approveSubmission: (submissionId) =>
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId
          ? { ...s, status: 'approved' as const, reviewedAt: new Date().toISOString() }
          : s
      ),
    })),

  rejectSubmission: (submissionId, notes) =>
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId
          ? { ...s, status: 'rejected' as const, reviewNotes: notes, reviewedAt: new Date().toISOString() }
          : s
      ),
    })),

  approveCompliance: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, complianceStatus: 'approved' as const } : t
      ),
    })),

  rejectCompliance: (taskId, notes) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, complianceStatus: 'rejected' as const, complianceNotes: notes } : t
      ),
    })),

  resolveAlert: (alertId) =>
    set((state) => ({
      resolvedAlertIds: [...state.resolvedAlertIds, alertId],
    })),

  resolvedAlertIds: [],
}))
