import { create } from 'zustand';
import type { Alert } from '../types/monitoring';

interface AppState {
  sidebarCollapsed: boolean;
  searchKeyword: string;
  alerts: Alert[];
  unreadCount: number;
  currentPage: string;
  
  toggleSidebar: () => void;
  setSearchKeyword: (keyword: string) => void;
  setCurrentPage: (page: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
}

import { mockAlerts } from '../data/monitoring';

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  searchKeyword: '',
  alerts: mockAlerts,
  unreadCount: mockAlerts.filter(a => a.status === 'unread').length,
  currentPage: 'home',
  
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => 
      a.id === id ? { ...a, status: 'read' as const } : a
    ),
    unreadCount: state.unreadCount - 1,
  })),
  
  markAllAlertsRead: () => set((state) => ({
    alerts: state.alerts.map(a => ({ ...a, status: 'read' as const })),
    unreadCount: 0,
  })),
}));
