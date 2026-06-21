import { create } from 'zustand';
import type { Alert } from '../types/monitoring';
import type { Company } from '../types/company';

interface AppState {
  sidebarCollapsed: boolean;
  searchKeyword: string;
  alerts: Alert[];
  unreadCount: number;
  currentPage: string;
  selectedCompany: Company | null;
  financeContext: {
    companyId: string | null;
    source: 'finance' | 'home' | null;
  };
  
  toggleSidebar: () => void;
  setSearchKeyword: (keyword: string) => void;
  setCurrentPage: (page: string) => void;
  setSelectedCompany: (company: Company | null) => void;
  setFinanceContext: (ctx: { companyId: string | null; source: 'finance' | 'home' | null }) => void;
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
  selectedCompany: null,
  financeContext: {
    companyId: null,
    source: null,
  },
  
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  setFinanceContext: (ctx) => set({ financeContext: ctx }),
  
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
