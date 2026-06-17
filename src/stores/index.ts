import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  Owner,
  Motion,
  FinanceAccount,
  Invoice,
  SealApplication,
  RepairTicket,
  SwapItem,
  CrowdfundingProject,
  ExchangeService,
  CommunityHealth,
  TodoItem,
  CouncilMember,
  PropertyCompany,
  MaintenanceStaff,
  StreetInstruction,
  CreditScore,
  AuditReport,
  ExchangeRecord,
  Voucher,
} from "@/types";
import {
  mockCurrentUser,
  mockOwners,
  mockMotions,
  mockFinanceAccounts,
  mockInvoices,
  mockSealApplications,
  mockRepairTickets,
  mockSwapItems,
  mockCrowdfundingProjects,
  mockExchangeServices,
  mockCommunityHealth,
  mockTodos,
  mockCouncilMembers,
  mockPropertyCompany,
  mockMaintenanceStaff,
  mockStreetInstructions,
  mockCreditScore,
  mockAuditReport,
  mockVouchers,
} from "@/mock/data";

interface AppState {
  currentUser: User;
  owners: Owner[];
  motions: Motion[];
  financeAccounts: FinanceAccount[];
  invoices: Invoice[];
  vouchers: Voucher[];
  sealApplications: SealApplication[];
  repairTickets: RepairTicket[];
  swapItems: SwapItem[];
  crowdfundingProjects: CrowdfundingProject[];
  exchangeServices: ExchangeService[];
  exchangeRecords: ExchangeRecord[];
  communityHealth: CommunityHealth;
  todos: TodoItem[];
  councilMembers: CouncilMember[];
  propertyCompany: PropertyCompany;
  maintenanceStaff: MaintenanceStaff[];
  streetInstructions: StreetInstruction[];
  creditScore: CreditScore;
  auditReport: AuditReport;
  sidebarCollapsed: boolean;
  isGeneratingAuditReport: boolean;
  auditGenerateProgress: number;
  auditGenerateStep: number;

  setSidebarCollapsed: (collapsed: boolean) => void;

  updateMotion: (id: string, updates: Partial<Motion>) => void;
  addMotion: (motion: Motion) => void;
  castVote: (
    motionId: string,
    vote: "agree" | "disagree" | "abstain"
  ) => void;

  updateSealApplication: (
    id: string,
    updates: Partial<SealApplication>
  ) => void;
  addSealApplication: (application: SealApplication) => void;

  updateRepairTicket: (
    id: string,
    updates: Partial<RepairTicket>
  ) => void;
  addRepairTicket: (ticket: RepairTicket) => void;

  verifyInvoice: (id: string, updates?: Partial<Invoice>) => void;
  rejectInvoice: (id: string, reason: string) => void;
  startOcrRecognition: (id: string) => void;

  generateAuditReport: () => Promise<void>;

  updateSwapItem: (id: string, updates: Partial<SwapItem>) => void;
  addSwapItem: (item: SwapItem) => void;

  addExchangeRecord: (record: ExchangeRecord) => void;

  updateTodoStatus: (id: string, completed: boolean) => void;

  updateStreetInstruction: (
    id: string,
    updates: Partial<StreetInstruction>
  ) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: mockCurrentUser,
      owners: mockOwners,
      motions: mockMotions,
      financeAccounts: mockFinanceAccounts,
      invoices: mockInvoices,
      vouchers: mockVouchers,
      sealApplications: mockSealApplications,
      repairTickets: mockRepairTickets,
      swapItems: mockSwapItems,
      crowdfundingProjects: mockCrowdfundingProjects,
      exchangeServices: mockExchangeServices,
      exchangeRecords: [],
      communityHealth: mockCommunityHealth,
      todos: mockTodos,
      councilMembers: mockCouncilMembers,
      propertyCompany: mockPropertyCompany,
      maintenanceStaff: mockMaintenanceStaff,
      streetInstructions: mockStreetInstructions,
      creditScore: mockCreditScore,
      auditReport: mockAuditReport,
      sidebarCollapsed: false,
      isGeneratingAuditReport: false,
      auditGenerateProgress: 0,
      auditGenerateStep: 0,

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      updateMotion: (id, updates) =>
        set((state) => ({
          motions: state.motions.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      addMotion: (motion) =>
        set((state) => ({ motions: [motion, ...state.motions] })),

      castVote: (motionId, vote) =>
        set((state) => {
          const motions = state.motions.map((m) => {
            if (m.id !== motionId) return m;
            const stats = { ...m.voteStats };
            stats.votedCount += 1;
            if (vote === "agree") stats.agreeCount += 1;
            else if (vote === "disagree") stats.disagreeCount += 1;
            else stats.abstainCount += 1;
            return { ...m, voteStats: stats };
          });
          return { motions };
        }),

      updateSealApplication: (id, updates) =>
        set((state) => ({
          sealApplications: state.sealApplications.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      addSealApplication: (application) =>
        set((state) => ({
          sealApplications: [application, ...state.sealApplications],
        })),

      updateRepairTicket: (id, updates) =>
        set((state) => ({
          repairTickets: state.repairTickets.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      addRepairTicket: (ticket) =>
        set((state) => ({
          repairTickets: [ticket, ...state.repairTickets],
        })),

      verifyInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  verified: true,
                  ocrStatus: "verified",
                  verifiedBy: state.currentUser.id,
                  verifiedAt: new Date().toISOString(),
                  ...updates,
                }
              : inv
          ),
        })),

      rejectInvoice: (id, reason) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  ocrStatus: "failed",
                  rejectReason: reason,
                }
              : inv
          ),
        })),

      startOcrRecognition: (id) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ocrStatus: "recognizing" } : inv
          ),
        })),

      generateAuditReport: async () => {
        set({ isGeneratingAuditReport: true, auditGenerateProgress: 0, auditGenerateStep: 0 });
        const steps = [20, 40, 60, 80, 100];
        for (let i = 0; i < steps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          set({ auditGenerateProgress: steps[i], auditGenerateStep: i + 1 });
        }
        set({ isGeneratingAuditReport: false });
      },

      updateSwapItem: (id, updates) =>
        set((state) => ({
          swapItems: state.swapItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      addSwapItem: (item) =>
        set((state) => ({ swapItems: [item, ...state.swapItems] })),

      addExchangeRecord: (record) =>
        set((state) => ({
          exchangeRecords: [record, ...state.exchangeRecords],
          creditScore: {
            ...state.creditScore,
            energy: state.creditScore.energy - record.energyCost * record.quantity,
          },
        })),

      updateTodoStatus: (id, completed) =>
        set((state) => ({
          todos: completed
            ? state.todos.filter((t) => t.id !== id)
            : state.todos,
        })),

      updateStreetInstruction: (id, updates) =>
        set((state) => ({
          streetInstructions: state.streetInstructions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
    }),
    {
      name: "community-gov-store",
      partialize: (state) => ({
        motions: state.motions,
        invoices: state.invoices,
        sealApplications: state.sealApplications,
        repairTickets: state.repairTickets,
        exchangeRecords: state.exchangeRecords,
        creditScore: state.creditScore,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
