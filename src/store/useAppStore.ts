import { create } from "zustand"
import type { Account, RentalOrder, TradeOrder, RecycleBid, InsuranceClaim, RiskAlert } from "@/types"
import { mockAccounts, mockRentalOrders, mockTradeOrders, mockRecycleBids, mockInsuranceClaims, mockRiskAlerts } from "@/data/mockData"

interface AppState {
  accounts: Account[]
  rentalOrders: RentalOrder[]
  tradeOrders: TradeOrder[]
  recycleBids: RecycleBid[]
  insuranceClaims: InsuranceClaim[]
  riskAlerts: RiskAlert[]
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  selectedAccountId: string | null
  setSelectedAccountId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  accounts: mockAccounts,
  rentalOrders: mockRentalOrders,
  tradeOrders: mockTradeOrders,
  recycleBids: mockRecycleBids,
  insuranceClaims: mockInsuranceClaims,
  riskAlerts: mockRiskAlerts,
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}))
