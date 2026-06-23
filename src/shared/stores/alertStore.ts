import { create } from 'zustand'
import type { Alert } from '@shared/types'
import { mockAlerts } from '@mock/data'

interface AlertStore {
  alerts: Alert[]
  unreadCount: number
  setAlerts: (alerts: Alert[]) => void
  markAsRead: (alertId: string) => void
  resolveAlert: (alertId: string, handler: string) => void
  addAlert: (alert: Alert) => void
  getAlertsByLevel: (level: string) => Alert[]
  getPendingCount: () => number
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: mockAlerts,
  unreadCount: mockAlerts.filter((a) => a.status === 'pending').length,
  setAlerts: (alerts) => set({ alerts }),
  markAsRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alert_id === alertId && a.status === 'pending'
          ? { ...a, status: 'processing' }
          : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  resolveAlert: (alertId, handler) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alert_id === alertId
          ? { ...a, status: 'resolved', resolved_at: new Date().toISOString(), handler }
          : a
      ),
    })),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    })),
  getAlertsByLevel: (level) => get().alerts.filter((a) => a.level === level),
  getPendingCount: () => get().alerts.filter((a) => a.status === 'pending').length,
}))
