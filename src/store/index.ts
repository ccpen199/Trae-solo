import { create } from 'zustand'
import type {
  AppUser,
  Technician,
  RepairTask,
  Review,
  ServiceReport,
  PaymentProof,
  TaskStatus,
  TaskCheckin,
  ServiceNode,
  ServicePart,
  UserRole,
} from '../types'
import { generateId } from '../utils/crypto'
import {
  saveTask,
  getAllTasks,
  saveReview,
  getAllReviews,
  saveReport,
  getAllReports,
  savePayment,
  getAllPayments,
  saveTechnician,
  getAllTechnicians,
  saveUser,
  getCurrentUser,
  addToOfflineQueue,
  getOfflineQueue,
  clearOfflineQueueItem,
} from '../utils/storage'
import { mockTechnicians } from '../data/mockData'

interface OfflineQueueItem {
  id: string
  action: string
  data: unknown
  timestamp: number
}

interface AppState {
  currentUser: AppUser | null
  currentTechnician: Technician | null
  technicians: Technician[]
  tasks: RepairTask[]
  reviews: Review[]
  reports: ServiceReport[]
  payments: PaymentProof[]
  online: boolean
  isInitialized: boolean
  offlineQueue: OfflineQueueItem[]

  initApp: () => Promise<void>
  switchRole: (role: UserRole, technicianId?: string) => Promise<void>

  createTask: (task: Omit<RepairTask, 'id' | 'status' | 'checkins' | 'bids' | 'createdAt' | 'userId'>) => Promise<RepairTask>
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
  addTaskCheckin: (taskId: string, node: ServiceNode, note?: string) => Promise<void>
  acceptTask: (taskId: string, technicianId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<void>

  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>
  createServiceReport: (report: Omit<ServiceReport, 'id' | 'createdAt'>) => Promise<ServiceReport>
  uploadPaymentProof: (payment: Omit<PaymentProof, 'id' | 'uploadedAt'>) => Promise<PaymentProof>

  updateTechnician: (tech: Technician) => Promise<void>
  freezeTechnician: (techId: string, reason: string) => Promise<void>
  unfreezeTechnician: (techId: string) => Promise<void>

  setOnline: (online: boolean) => void
  refreshOfflineQueue: () => Promise<void>
  syncOfflineQueue: () => Promise<void>
  removeOfflineItem: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentTechnician: null,
  technicians: [],
  tasks: [],
  reviews: [],
  reports: [],
  payments: [],
  online: true,
  isInitialized: false,
  offlineQueue: [],

  initApp: async () => {
    const user = await getCurrentUser()
    if (!user) {
      const defaultUser: AppUser = {
        id: 'user-1',
        role: 'user',
        name: '陈先生',
        phone: '135****7890',
      }
      await saveUser(defaultUser)
      set({ currentUser: defaultUser })
    } else {
      set({ currentUser: user })
    }

    const storedTechs = await getAllTechnicians()
    if (storedTechs.length === 0) {
      for (const tech of mockTechnicians) {
        await saveTechnician(tech)
      }
      set({ technicians: mockTechnicians })
    } else {
      set({ technicians: storedTechs })
    }

    const tasks = await getAllTasks()
    const reviews = await getAllReviews()
    const reports = await getAllReports()
    const payments = await getAllPayments()
    const queue = await getOfflineQueue()

    set({
      tasks,
      reviews,
      reports,
      payments,
      offlineQueue: queue as OfflineQueueItem[],
      isInitialized: true,
    })
  },

  switchRole: async (role: UserRole, technicianId?: string) => {
    const { currentUser } = get()
    if (!currentUser) return

    const updatedUser = { ...currentUser, role }
    await saveUser(updatedUser)
    set({ currentUser: updatedUser })

    if (role === 'technician' && technicianId) {
      const tech = get().technicians.find(t => t.id === technicianId)
      set({ currentTechnician: tech || null })
    } else {
      set({ currentTechnician: null })
    }
  },

  createTask: async (taskData) => {
    const { currentUser, online } = get()
    if (!currentUser) throw new Error('未登录')

    const newTask: RepairTask = {
      ...taskData,
      id: generateId('task'),
      userId: currentUser.id,
      status: 'broadcasting',
      checkins: [],
      bids: [],
      createdAt: new Date().toISOString(),
    }

    if (online) {
      await saveTask(newTask)
    } else {
      await addToOfflineQueue('createTask', newTask)
    }

    set(state => ({ tasks: [newTask, ...state.tasks] }))
    return newTask
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    const { online } = get()
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTask = {
      ...task,
      status,
      ...(status === 'accepted' && !task.acceptedAt ? { acceptedAt: new Date().toISOString() } : {}),
      ...(status === 'completed' && !task.completedAt ? { completedAt: new Date().toISOString() } : {}),
    }

    if (online) {
      await saveTask(updatedTask)
    } else {
      await addToOfflineQueue('updateTask', updatedTask)
    }

    set(state => ({
      tasks: state.tasks.map(t => (t.id === taskId ? updatedTask : t)),
    }))
  },

  addTaskCheckin: async (taskId: string, node: ServiceNode, note?: string) => {
    const { online } = get()
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    const checkin: TaskCheckin = {
      node,
      timestamp: new Date().toISOString(),
      location: task.location,
      note,
    }

    const statusMap: Record<ServiceNode, TaskStatus> = {
      door_arrival: 'arrived',
      start_work: 'in_progress',
      completed: 'completed',
    }

    const updatedTask: RepairTask = {
      ...task,
      checkins: [...task.checkins, checkin],
      status: statusMap[node],
      ...(node === 'completed' ? { completedAt: new Date().toISOString() } : {}),
    }

    if (online) {
      await saveTask(updatedTask)
    } else {
      await addToOfflineQueue('updateTask', updatedTask)
    }

    set(state => ({
      tasks: state.tasks.map(t => (t.id === taskId ? updatedTask : t)),
    }))
  },

  acceptTask: async (taskId: string, technicianId: string) => {
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTask: RepairTask = {
      ...task,
      technicianId,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    }

    await saveTask(updatedTask)
    set(state => ({
      tasks: state.tasks.map(t => (t.id === taskId ? updatedTask : t)),
    }))
  },

  completeTask: async (taskId: string) => {
    await get().updateTaskStatus(taskId, 'completed')
  },

  addReview: async (reviewData) => {
    const newReview: Review = {
      ...reviewData,
      id: generateId('review'),
      createdAt: new Date().toISOString(),
    }

    await saveReview(newReview)

    const task = get().tasks.find(t => t.id === reviewData.taskId)
    if (task) {
      const updatedTask = {
        ...task,
        ...(reviewData.fromRole === 'user' ? { userReviewId: newReview.id } : { technicianReviewId: newReview.id }),
        status: task.userReviewId && task.technicianReviewId ? 'reviewed' : task.status,
      } as RepairTask
      await saveTask(updatedTask)

      if (reviewData.rating <= 2 && reviewData.fromRole === 'user') {
        const tech = get().technicians.find(t => t.id === task.technicianId)
        if (tech) {
          await get().freezeTechnician(tech.id, `收到差评：${reviewData.content.slice(0, 50)}`)
        }
      }
    }

    set(state => ({
      reviews: [...state.reviews, newReview],
      tasks: state.tasks.map(t => (t.id === reviewData.taskId && task ? {
        ...t,
        ...(reviewData.fromRole === 'user' ? { userReviewId: newReview.id } : { technicianReviewId: newReview.id }),
      } : t)),
    }))
  },

  createServiceReport: async (reportData) => {
    const newReport: ServiceReport = {
      ...reportData,
      id: generateId('report'),
      createdAt: new Date().toISOString(),
    }

    await saveReport(newReport)

    const task = get().tasks.find(t => t.id === reportData.taskId)
    if (task) {
      const updatedTask = { ...task, serviceReportId: newReport.id } as RepairTask
      await saveTask(updatedTask)
    }

    set(state => ({
      reports: [...state.reports, newReport],
      tasks: state.tasks.map(t => t.id === reportData.taskId ? { ...t, serviceReportId: newReport.id } : t),
    }))

    return newReport
  },

  uploadPaymentProof: async (paymentData) => {
    const newPayment: PaymentProof = {
      ...paymentData,
      id: generateId('payment'),
      uploadedAt: new Date().toISOString(),
    }

    await savePayment(newPayment)

    const task = get().tasks.find(t => t.id === paymentData.taskId)
    if (task) {
      const updatedTask = { ...task, paymentProofId: newPayment.id, status: 'paid' as TaskStatus } as RepairTask
      await saveTask(updatedTask)
    }

    set(state => ({
      payments: [...state.payments, newPayment],
      tasks: state.tasks.map(t => t.id === paymentData.taskId ? { ...t, paymentProofId: newPayment.id, status: 'paid' } : t),
    }))

    return newPayment
  },

  updateTechnician: async (tech: Technician) => {
    await saveTechnician(tech)
    set(state => ({
      technicians: state.technicians.map(t => t.id === tech.id ? tech : t),
      currentTechnician: state.currentTechnician?.id === tech.id ? tech : state.currentTechnician,
    }))
  },

  freezeTechnician: async (techId: string, reason: string) => {
    const tech = get().technicians.find(t => t.id === techId)
    if (!tech) return

    const updated = { ...tech, frozen: true, frozenReason: reason }
    await get().updateTechnician(updated)
  },

  unfreezeTechnician: async (techId: string) => {
    const tech = get().technicians.find(t => t.id === techId)
    if (!tech) return

    const updated = { ...tech, frozen: false, frozenReason: undefined }
    await get().updateTechnician(updated)
  },

  setOnline: (online: boolean) => set({ online }),

  refreshOfflineQueue: async () => {
    const queue = await getOfflineQueue()
    set({ offlineQueue: queue as OfflineQueueItem[] })
  },

  syncOfflineQueue: async () => {
    const { offlineQueue } = get()
    if (!get().online) return

    for (const item of offlineQueue) {
      try {
        switch (item.action) {
          case 'createTask':
            await saveTask(item.data as RepairTask)
            break
          case 'updateTask':
            await saveTask(item.data as RepairTask)
            break
        }
        await clearOfflineQueueItem(item.id)
      } catch (e) {
        console.error('Sync failed for item', item.id, e)
      }
    }
    const queue = await getOfflineQueue()
    set({ offlineQueue: queue as OfflineQueueItem[] })
  },

  removeOfflineItem: async (id: string) => {
    await clearOfflineQueueItem(id)
    const queue = await getOfflineQueue()
    set({ offlineQueue: queue as OfflineQueueItem[] })
  },
}))
