import { create } from "zustand"
import type {
  ServiceApplication,
  ECertificate,
  TrafficViolation,
  ChatMessage,
  Suggestion,
  PublicOpinion,
  Announcement,
} from "@/lib/mockData"
import {
  mockApplications,
  mockCertificates,
  mockViolations,
  mockChatHistory,
  mockSuggestions,
  mockPublicOpinions,
  mockAnnouncements,
} from "@/lib/mockData"

export interface Notification {
  id: string
  title: string
  content: string
  time: string
  read: boolean
}

export interface AuditLog {
  id: string
  operator: string
  action: string
  target: string
  time: string
}

interface AppState {
  currentRole: "citizen" | "police"
  policeVerified: boolean
  applications: ServiceApplication[]
  certificates: ECertificate[]
  violations: TrafficViolation[]
  chatMessages: ChatMessage[]
  suggestions: Suggestion[]
  publicOpinions: PublicOpinion[]
  announcements: Announcement[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  switchRole: () => void
  verifyPolice: () => void
  logoutPolice: () => void
  addChatMessage: (msg: ChatMessage) => void
  addSuggestion: (sug: Suggestion) => void
  addApplication: (app: ServiceApplication) => void
  updateApplicationStatus: (id: string, status: ServiceApplication["status"]) => void
  updateCertificateStatus: (id: string, status: ECertificate["status"]) => void
  markAnnouncementRead: (id: string) => void
  payViolation: (id: string) => void
  updateSuggestionStatus: (id: string, status: Suggestion["status"], response?: string) => void
  updatePublicOpinionStatus: (id: string, status: PublicOpinion["status"], response?: string) => void
  addNotification: (n: Notification) => void
  clearNotifications: () => void
  addAuditLog: (action: string, target: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: "citizen",
  policeVerified: false,
  applications: mockApplications,
  certificates: mockCertificates,
  violations: mockViolations,
  chatMessages: mockChatHistory,
  suggestions: mockSuggestions,
  publicOpinions: mockPublicOpinions,
  announcements: mockAnnouncements,
  notifications: [],
  auditLogs: [],

  switchRole: () =>
    set((state) => {
      if (state.currentRole === "police") {
        return { currentRole: "citizen", policeVerified: false }
      }
      return { currentRole: "police" }
    }),

  verifyPolice: () =>
    set({ policeVerified: true }),

  logoutPolice: () =>
    set({ currentRole: "citizen", policeVerified: false }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),

  addSuggestion: (sug) =>
    set((state) => ({
      suggestions: [sug, ...state.suggestions],
    })),

  addApplication: (app) =>
    set((state) => ({
      applications: [app, ...state.applications],
    })),

  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              currentStep:
                status === "approved" || status === "completed"
                  ? a.totalSteps
                  : status === "processing"
                  ? Math.min(a.currentStep + 1, a.totalSteps)
                  : a.currentStep,
              updateTime: new Date().toLocaleString("zh-CN"),
            }
          : a
      ),
    })),

  updateCertificateStatus: (id, status) =>
    set((state) => ({
      certificates: state.certificates.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    })),

  markAnnouncementRead: (id) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, isRead: true } : a
      ),
    })),

  payViolation: (id) =>
    set((state) => ({
      violations: state.violations.map((v) =>
        v.id === id ? { ...v, status: "paid" as const } : v
      ),
    })),

  updateSuggestionStatus: (id, status, response) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, status, response: response || s.response } : s
      ),
    })),

  updatePublicOpinionStatus: (id, status, response) =>
    set((state) => ({
      publicOpinions: state.publicOpinions.map((p) =>
        p.id === id ? { ...p, status, response: response || p.response } : p
      ),
    })),

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
    })),

  clearNotifications: () =>
    set({ notifications: [] }),

  addAuditLog: (action, target) =>
    set((state) => ({
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          operator: "民警李明",
          action,
          target,
          time: new Date().toLocaleString("zh-CN"),
        },
        ...state.auditLogs,
      ],
    })),
}))
