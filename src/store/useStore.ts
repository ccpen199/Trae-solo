import { create } from 'zustand'
import type { User, ChatMessage, Certificate, ApplicationRecord } from '@/types'
import { mockUser, mockCertificates, mockApplications, mockChatHistory } from '@/data/mockData'

interface AppState {
  user: User
  certificates: Certificate[]
  applications: ApplicationRecord[]
  chatMessages: ChatMessage[]
  elderlyMode: boolean
  fontSize: number
  sidebarOpen: boolean
  currentPath: string

  toggleElderlyMode: () => void
  setFontSize: (size: number) => void
  toggleSidebar: () => void
  setCurrentPath: (path: string) => void
  addChatMessage: (message: ChatMessage) => void
  updateApplicationStatus: (id: string, status: ApplicationRecord['status']) => void
  submitSatisfaction: (id: string, score: number, feedback: string) => void
}

export const useStore = create<AppState>((set) => ({
  user: mockUser,
  certificates: mockCertificates,
  applications: mockApplications,
  chatMessages: mockChatHistory,
  elderlyMode: false,
  fontSize: 14,
  sidebarOpen: false,
  currentPath: '/',

  toggleElderlyMode: () =>
    set((state) => {
      const newElderlyMode = !state.elderlyMode
      return {
        elderlyMode: newElderlyMode,
        fontSize: newElderlyMode ? 20 : 14,
        user: { ...state.user, elderlyMode: newElderlyMode, fontSize: newElderlyMode ? 20 : 14 },
      }
    }),

  setFontSize: (size) =>
    set((state) => ({
      fontSize: size,
      user: { ...state.user, fontSize: size },
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
}))
