import { create } from 'zustand'
import type { User, ChatMessage, Certificate, ApplicationRecord } from '@/types'
import { mockUser, mockCertificates, mockApplications, mockChatHistory } from '@/data/mockData'

interface AppState {
  user: User | null
  isAuthenticated: boolean
  isAuthenticating: boolean
  certificates: Certificate[]
  applications: ApplicationRecord[]
  chatMessages: ChatMessage[]
  elderlyMode: boolean
  fontSize: number
  sidebarOpen: boolean
  currentPath: string
  loginError: string | null

  loginWithSSO: () => Promise<boolean>
  logout: () => void
  toggleElderlyMode: () => void
  setFontSize: (size: number) => void
  toggleSidebar: () => void
  setCurrentPath: (path: string) => void
  addChatMessage: (message: ChatMessage) => void
  updateApplicationStatus: (id: string, status: ApplicationRecord['status']) => void
  submitSatisfaction: (id: string, score: number, feedback: string) => void
  submitApplication: (serviceId: string, serviceName: string, formData: Record<string, string>) => Promise<string>
  uploadMaterial: (applicationId: string, materialName: string) => Promise<boolean>
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthenticating: false,
  certificates: mockCertificates,
  applications: mockApplications,
  chatMessages: mockChatHistory,
  elderlyMode: false,
  fontSize: 14,
  sidebarOpen: false,
  currentPath: '/',
  loginError: null,

  loginWithSSO: async () => {
    set({ isAuthenticating: true, loginError: null })
    await new Promise((resolve) => setTimeout(resolve, 1500))
    try {
      set({
        user: mockUser,
        isAuthenticated: true,
        isAuthenticating: false,
      })
      return true
    } catch (e) {
      set({
        isAuthenticating: false,
        loginError: '身份认证失败，请重试',
      })
      return false
    }
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      elderlyMode: false,
      fontSize: 14,
    })
  },

  toggleElderlyMode: () =>
    set((state) => {
      const newElderlyMode = !state.elderlyMode
      return {
        elderlyMode: newElderlyMode,
        fontSize: newElderlyMode ? 20 : 14,
        user: state.user ? { ...state.user, elderlyMode: newElderlyMode, fontSize: newElderlyMode ? 20 : 14 } : null,
      }
    }),

  setFontSize: (size) =>
    set((state) => ({
      fontSize: size,
      user: state.user ? { ...state.user, fontSize: size } : null,
    })),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setCurrentPath: (path) =>
    set({ currentPath: path }),

  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, status } : app
      ),
    })),

  submitSatisfaction: (id, score, feedback) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, satisfaction: score, feedback } : app
      ),
    })),

  submitApplication: async (serviceId, serviceName, formData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newId = `a${Date.now()}`
    const newApp: ApplicationRecord = {
      id: newId,
      serviceId,
      serviceName,
      status: '审核中',
      submittedAt: new Date().toISOString().split('T')[0],
      estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
    set((state) => ({
      applications: [newApp, ...state.applications],
    }))
    return newId
  },

  uploadMaterial: async (applicationId, materialName) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return true
  },
}))
