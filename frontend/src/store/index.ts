import { create } from 'zustand'
import type { 
  Declaration, 
  DeclarationStatus,
  TodoItem,
  Message,
  User,
} from '@/types'
import { dashboardApi, declarationApi, userApi, constantsApi } from '@/services/api'

interface AppState {
  loading: boolean
  constants: {
    UserRole: Record<string, string>
    DeclarationStatus: Record<string, string>
    DocumentType: Record<string, string>
    InspectionResult: Record<string, string>
  } | null
  
  currentUser: User | null
  
  declarations: Declaration[]
  totalDeclarations: number
  currentPage: number
  pageSize: number
  
  selectedDeclaration: Declaration | null
  
  statusCounts: Record<string, { count: number; displayName: string }> | null
  
  statistics: {
    total: number
    completed: number
    rejected: number
    inProgress: number
    avgProcessingTime: string
    completionRate: string
  } | null
  
  kanbanData: Record<string, {
    statusName: string
    count: number
    items: Declaration[]
  }> | null
  
  todoItems: TodoItem[]
  messages: Message[]
  unreadCount: number
  
  actions: {
    initConstants: () => Promise<void>
    setLoading: (loading: boolean) => void
    
    fetchDeclarations: (params?: {
      status?: string
      search?: string
      page?: number
      pageSize?: number
    }) => Promise<void>
    
    fetchDeclarationById: (id: string) => Promise<void>
    clearSelectedDeclaration: () => void
    
    createDeclaration: (data: any) => Promise<{ success: boolean; errors?: string[] }>
    updateDeclaration: (id: string, data: any) => Promise<{ success: boolean; errors?: string[] }>
    
    performAction: (id: string, action: string, comment?: string) => Promise<{ success: boolean; errors?: string[] }>
    
    fetchStatusCounts: () => Promise<void>
    fetchStatistics: (params?: { startDate?: string; endDate?: string }) => Promise<void>
    fetchKanban: () => Promise<void>
    
    fetchTodos: (userId: string, params?: any) => Promise<void>
    fetchMessages: (userId: string, params?: any) => Promise<void>
    markMessageRead: (messageId: string) => Promise<void>
    
    getStatusColor: (status: DeclarationStatus) => string
    getStatusName: (status: DeclarationStatus) => string
  }
}

const STATUS_COLORS: Record<DeclarationStatus, string> = {
  DRAFT: 'default',
  PENDING_DATA_ENTRY: 'blue',
  PENDING_CLASSIFICATION: 'cyan',
  PENDING_DECLARATION: 'purple',
  PENDING_INSPECTION_TAX: 'orange',
  RELEASED_ARCHIVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'default',
  EXCEPTION: 'red',
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: false,
  constants: null,
  currentUser: {
    id: 'system-user-001',
    username: 'admin',
    name: '系统管理员',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  
  declarations: [],
  totalDeclarations: 0,
  currentPage: 1,
  pageSize: 20,
  
  selectedDeclaration: null,
  statusCounts: null,
  statistics: null,
  kanbanData: null,
  
  todoItems: [],
  messages: [],
  unreadCount: 0,
  
  actions: {
    initConstants: async () => {
      try {
        const res = await constantsApi.getAll()
        if (res.success) {
          set({ constants: res.data })
        }
      } catch (error) {
        console.error('Failed to load constants:', error)
      }
    },
    
    setLoading: (loading: boolean) => set({ loading }),
    
    fetchDeclarations: async (params) => {
      set({ loading: true })
      try {
        const res = await declarationApi.getList({
          page: 1,
          pageSize: 20,
          ...params,
        })
        if (res.success) {
          set({
            declarations: res.data.items,
            totalDeclarations: res.data.total,
            currentPage: res.data.page,
            pageSize: res.data.pageSize,
          })
        }
      } catch (error) {
        console.error('Failed to fetch declarations:', error)
      } finally {
        set({ loading: false })
      }
    },
    
    fetchDeclarationById: async (id: string) => {
      set({ loading: true })
      try {
        const res = await declarationApi.getById(id)
        if (res.success) {
          set({ selectedDeclaration: res.data })
        }
      } catch (error) {
        console.error('Failed to fetch declaration:', error)
      } finally {
        set({ loading: false })
      }
    },
    
    clearSelectedDeclaration: () => set({ selectedDeclaration: null }),
    
    createDeclaration: async (data) => {
      set({ loading: true })
      try {
        const res = await declarationApi.create(data)
        if (res.success) {
          return { success: true }
        }
        return { success: false, errors: res.errors }
      } catch (error: any) {
        return { success: false, errors: [error.message] }
      } finally {
        set({ loading: false })
      }
    },
    
    updateDeclaration: async (id, data) => {
      set({ loading: true })
      try {
        const res = await declarationApi.update(id, data)
        if (res.success) {
          return { success: true }
        }
        return { success: false, errors: res.errors }
      } catch (error: any) {
        return { success: false, errors: [error.message] }
      } finally {
        set({ loading: false })
      }
    },
    
    performAction: async (id, action, comment) => {
      set({ loading: true })
      try {
        const res = await declarationApi.performAction(id, action, comment)
        if (res.success) {
          await get().actions.fetchDeclarationById(id)
          return { success: true }
        }
        return { success: false, errors: res.errors }
      } catch (error: any) {
        return { success: false, errors: [error.message] }
      } finally {
        set({ loading: false })
      }
    },
    
    fetchStatusCounts: async () => {
      try {
        const res = await dashboardApi.getStatusCounts()
        if (res.success) {
          set({ statusCounts: res.data })
        }
      } catch (error) {
        console.error('Failed to fetch status counts:', error)
      }
    },
    
    fetchStatistics: async (params) => {
      try {
        const res = await dashboardApi.getStatistics(params)
        if (res.success) {
          set({ statistics: res.data })
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      }
    },
    
    fetchKanban: async () => {
      set({ loading: true })
      try {
        const res = await dashboardApi.getKanban()
        if (res.success) {
          set({ kanbanData: res.data })
        }
      } catch (error) {
        console.error('Failed to fetch kanban:', error)
      } finally {
        set({ loading: false })
      }
    },
    
    fetchTodos: async (userId, params) => {
      try {
        const res = await userApi.getTodos(userId, params)
        if (res.success) {
          set({ todoItems: res.data.items })
        }
      } catch (error) {
        console.error('Failed to fetch todos:', error)
      }
    },
    
    fetchMessages: async (userId, params) => {
      try {
        const res = await userApi.getMessages(userId, params)
        if (res.success) {
          set({
            messages: res.data.items,
            unreadCount: res.data.items.filter(m => !m.isRead).length,
          })
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    },
    
    markMessageRead: async (messageId) => {
      try {
        await userApi.markMessageRead(messageId)
      } catch (error) {
        console.error('Failed to mark message read:', error)
      }
    },
    
    getStatusColor: (status) => STATUS_COLORS[status] || 'default',
    getStatusName: (status) => {
      const { constants } = get()
      return constants?.DeclarationStatus?.[status] || status
    },
  },
}))
