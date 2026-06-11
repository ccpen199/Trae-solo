import { create } from "zustand"
import type { Account, RentalOrder, TradeOrder, RecycleBid, InsuranceClaim, RiskAlert } from "@/types"
import { mockAccounts, mockRentalOrders, mockTradeOrders, mockRecycleBids, mockInsuranceClaims, mockRiskAlerts } from "@/data/mockData"

export type RentalStep = "select" | "period" | "device" | "deposit" | "active" | "return" | "done"
export type TradeStep = "order" | "contract" | "escrow" | "transfer" | "release" | "done"
export type DisputeStep = "none" | "evidence" | "arbitrating" | "resolved"
export type ValuationStep = "input" | "loading" | "report" | "confirmed"
export type RecycleStep = "submit" | "bidding" | "accept" | "transfer" | "done"
export type ClaimStep = "view" | "apply" | "verifying" | "approved" | "paid"

interface FlowState {
  rentalStep: RentalStep
  rentalAccountId: string | null
  rentalPeriod: "hourly" | "daily"
  rentalHours: number
  deviceBound: boolean
  depositPaid: boolean
  circuitBreaker: boolean

  tradeStep: TradeStep
  tradeAccountId: string | null
  contractSigned: boolean
  escrowFrozen: boolean
  transferConfirmed: boolean
  fundsReleased: boolean
  disputeStep: DisputeStep
  disputeReason: string

  valuationStep: ValuationStep
  valuationAccountId: string | null
  chainConfirmed: boolean

  recycleStep: RecycleStep
  recycleAccountId: string | null
  acceptedBidId: string | null
  recycleTransferDone: boolean

  claimStep: ClaimStep
  claimPolicyId: string | null
  claimDescription: string
}

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
  flow: FlowState
  setFlow: (partial: Partial<FlowState>) => void
  resetFlow: (flowType: "rental" | "trade" | "valuation" | "recycle" | "claim") => void
}

const initialFlow: FlowState = {
  rentalStep: "select", rentalAccountId: null, rentalPeriod: "daily", rentalHours: 4, deviceBound: false, depositPaid: false, circuitBreaker: false,
  tradeStep: "order", tradeAccountId: null, contractSigned: false, escrowFrozen: false, transferConfirmed: false, fundsReleased: false, disputeStep: "none", disputeReason: "",
  valuationStep: "input", valuationAccountId: null, chainConfirmed: false,
  recycleStep: "submit", recycleAccountId: null, acceptedBidId: null, recycleTransferDone: false,
  claimStep: "view", claimPolicyId: null, claimDescription: "",
}

const resetMap: Record<string, Partial<FlowState>> = {
  rental: { rentalStep: "select", rentalAccountId: null, rentalPeriod: "daily", rentalHours: 4, deviceBound: false, depositPaid: false, circuitBreaker: false },
  trade: { tradeStep: "order", tradeAccountId: null, contractSigned: false, escrowFrozen: false, transferConfirmed: false, fundsReleased: false, disputeStep: "none", disputeReason: "" },
  valuation: { valuationStep: "input", valuationAccountId: null, chainConfirmed: false },
  recycle: { recycleStep: "submit", recycleAccountId: null, acceptedBidId: null, recycleTransferDone: false },
  claim: { claimStep: "view", claimPolicyId: null, claimDescription: "" },
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
  flow: initialFlow,
  setFlow: (partial) => set((s) => ({ flow: { ...s.flow, ...partial } })),
  resetFlow: (flowType) => set((s) => ({ flow: { ...s.flow, ...resetMap[flowType] } })),
}))
