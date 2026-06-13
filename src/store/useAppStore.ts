import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  ExpressOrder,
  Customer,
  WaybillTemplate,
  PrintJob,
  BusinessMetrics,
  SplitRule,
  SettlementDetail,
  DashboardSummary,
  TaskItem,
  AuditLogEntry,
  PermissionConfig,
  ComplianceConfig,
  TrackingEvent,
  Announcement,
} from "@/types";
import {
  mockUsers,
  mockOrders,
  mockCustomers,
  mockTemplates,
  mockPrintJobs,
  mockMetrics,
  mockSplitRules,
  mockSettlements,
  mockSummary,
  mockTasks,
  mockAuditLog,
  mockPermissions,
  mockCompliance,
  generateTracking,
  mockAnnouncements,
} from "@/mock";
import { setCurrentUser, clearCurrentUser, getCurrentUser } from "@/utils/auth";

interface AppState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  syncUserFromStorage: () => void;
  orders: ExpressOrder[];
  updateOrderStatus: (id: string, status: ExpressOrder["status"]) => void;
  addOrder: (o: ExpressOrder) => void;
  customers: Customer[];
  bindCustomer: (phone: string) => Customer | null;
  templates: WaybillTemplate[];
  printJobs: PrintJob[];
  createPrintJob: (orderIds: string[], templateId: string) => void;
  metrics: BusinessMetrics[];
  splitRules: SplitRule[];
  settlements: SettlementDetail[];
  summary: DashboardSummary;
  tasks: TaskItem[];
  completeTask: (id: string) => void;
  auditLog: AuditLogEntry[];
  permissions: PermissionConfig[];
  compliance: ComplianceConfig;
  updateCompliance: (c: Partial<ComplianceConfig>) => void;
  getTracking: (no: string) => TrackingEvent[];
  announcements: Announcement[];
}

const initialUser = (() => {
  try {
    return getCurrentUser();
  } catch {
    return null;
  }
})();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      login: (username, _password) => {
        const found = mockUsers.find((u) => u.username === username.trim().toLowerCase());
        if (found) {
          set({ user: found });
          setCurrentUser(found);
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null });
        clearCurrentUser();
      },
      syncUserFromStorage: () => {
        const u = getCurrentUser();
        if (u) set({ user: u });
      },

      orders: mockOrders,
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, pickedAt: status === "picked" ? new Date().toISOString() : o.pickedAt } : o
          ),
        })),
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),

      customers: mockCustomers,
      bindCustomer: (phone) => {
        const existing = get().customers.find((c) => c.phone === phone);
        if (existing) return existing;
        const newC: Customer = {
          id: `c-${Date.now()}`,
          phone,
          name: "新客户",
          branchId: "b-001",
          bindType: "phone",
          bindQrCode: `https://syt.ink/c/${Date.now()}`,
          isProtocol: false,
          tags: ["新绑定"],
          totalOrders: 0,
          totalAmount: 0,
          lastOrderDate: new Date().toISOString().slice(0, 10),
          repurchaseRate: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customers: [newC, ...s.customers] }));
        return newC;
      },

      templates: mockTemplates,
      printJobs: mockPrintJobs,
      createPrintJob: (orderIds, templateId) => {
        const tpl = get().templates.find((t) => t.id === templateId);
        const job: PrintJob = {
          id: `pj-${Date.now()}`,
          orderIds,
          templateId,
          templateName: tpl?.name || "面单",
          printerId: "printer-hp-laser",
          printerType: "pc_browser",
          status: "queued",
          totalCount: orderIds.length,
          successCount: 0,
          failedCount: 0,
          createdAt: new Date().toISOString(),
          createdBy: get().user?.id || "",
        };
        set((s) => ({ printJobs: [job, ...s.printJobs] }));
      },

      metrics: mockMetrics,
      splitRules: mockSplitRules,
      settlements: mockSettlements,

      summary: mockSummary,
      tasks: mockTasks,
      completeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      auditLog: mockAuditLog,
      permissions: mockPermissions,
      compliance: mockCompliance,
      updateCompliance: (c) => set((s) => ({ compliance: { ...s.compliance, ...c } })),

      getTracking: (no) => generateTracking(no),
      announcements: mockAnnouncements,
    }),
    { name: "syt-app-store", partialize: (s) => ({ user: s.user, compliance: s.compliance }) }
  )
);
