import { create } from "zustand";
import type {
  User,
  LoginRequest,
  LoginResponse,
  OrgNode,
  Member,
  MemberAudit,
  VoucherTemplate,
  Voucher,
  PointsProduct,
  BudgetPlan,
  BudgetDetail,
  Booking,
  Supplier,
  FunnelData,
  MemberStats,
  RecommendationRule,
} from "@/types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `请求失败: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function apiCall(path: string, init?: RequestInit): Promise<ApiResponse<any>> {
  const token = localStorage.getItem("token");
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  return res.json();
}

interface TrendData {
  month: string;
  newMembers: number;
  activeMembers: number;
  vouchersIssued: number;
  vouchersUsed: number;
  pointsExchanged: number;
  totalAmount: number;
}

interface AppState {
  user: User | null;
  sidebarCollapsed: boolean;

  members: Member[];
  membersLoading: boolean;

  memberAudit: MemberAudit[];
  memberAuditLoading: boolean;

  orgTree: OrgNode[];

  voucherTemplates: VoucherTemplate[];
  myVouchers: Voucher[];

  pointsProducts: PointsProduct[];

  budgets: BudgetPlan[];
  budgetDetails: Record<string, BudgetDetail>;

  bookings: Booking[];

  suppliers: Supplier[];

  funnel: FunnelData[];
  memberStats: MemberStats | null;
  trends: TrendData[];

  recommendations: RecommendationRule[];

  login: (req: LoginRequest) => Promise<void>;
  logout: () => void;
  toggleSidebar: () => void;

  fetchMembers: (params?: Record<string, string>) => Promise<void>;
  fetchMemberAudit: (memberId: string) => Promise<void>;
  fetchOrgTree: () => Promise<void>;
  fetchVoucherTemplates: () => Promise<void>;
  fetchMyVouchers: (memberId: string) => Promise<void>;
  fetchPointsProducts: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchFunnel: () => Promise<void>;
  fetchMemberStats: () => Promise<void>;
  fetchTrends: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;

  approveMember: (id: string) => Promise<void>;
  rejectMember: (id: string, reason?: string) => Promise<void>;
  verifyMember: (idCard: string, employeeNo: string) => Promise<any>;
  approveBudget: (id: string, comment?: string) => Promise<void>;
  rejectBudget: (id: string, comment?: string) => Promise<void>;
  fetchBudgetDetail: (id: string) => Promise<BudgetDetail | null>;
  redeemVoucher: (id: string, memberId: string) => Promise<any>;
  batchRedeemVouchers: (voucherIds: string[], memberId: string) => Promise<any>;
  exchangePoints: (memberId: string, productId: string) => Promise<any>;
  approveSupplier: (id: string) => Promise<void>;
  assessSupplier: (id: string, score: number, comment: string, assessor: string) => Promise<void>;
  toggleRecommendation: (id: string, enabled: boolean) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  sidebarCollapsed: false,

  members: [],
  membersLoading: false,

  memberAudit: [],
  memberAuditLoading: false,

  orgTree: [],

  voucherTemplates: [],
  myVouchers: [],

  pointsProducts: [],

  budgets: [],
  budgetDetails: {},

  bookings: [],

  suppliers: [],

  funnel: [],
  memberStats: null,
  trends: [],

  recommendations: [],

  login: async (req: LoginRequest) => {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(req),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    set({ user: data.user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null });
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
  },

  fetchMembers: async (params?: Record<string, string>) => {
    if (get().membersLoading) return;
    set({ membersLoading: true });
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      const data = await apiFetch<Member[]>(`/organization/members${query}`);
      set({ members: data });
    } finally {
      set({ membersLoading: false });
    }
  },

  fetchMemberAudit: async (memberId: string) => {
    set({ memberAuditLoading: true });
    try {
      const data = await apiFetch<MemberAudit[]>(`/organization/members/${memberId}/audit`);
      set({ memberAudit: data });
    } finally {
      set({ memberAuditLoading: false });
    }
  },

  fetchOrgTree: async () => {
    const data = await apiFetch<OrgNode[]>("/organization/tree");
    set({ orgTree: data });
  },

  fetchVoucherTemplates: async () => {
    const data = await apiFetch<VoucherTemplate[]>("/benefits/vouchers/templates");
    set({ voucherTemplates: data });
  },

  fetchMyVouchers: async (memberId: string) => {
    const data = await apiFetch<Voucher[]>(`/benefits/vouchers/my?memberId=${memberId}`);
    set({ myVouchers: data });
  },

  fetchPointsProducts: async () => {
    const data = await apiFetch<PointsProduct[]>("/benefits/points/products");
    set({ pointsProducts: data });
  },

  fetchBudgets: async () => {
    const data = await apiFetch<BudgetPlan[]>("/benefits/budgets");
    set({ budgets: data });
  },

  fetchBookings: async () => {
    const data = await apiFetch<Booking[]>("/services/bookings");
    set({ bookings: data });
  },

  fetchSuppliers: async () => {
    const data = await apiFetch<Supplier[]>("/admin/suppliers");
    set({ suppliers: data });
  },

  fetchFunnel: async () => {
    const data = await apiFetch<FunnelData[]>("/admin/analytics/funnel");
    set({ funnel: data });
  },

  fetchMemberStats: async () => {
    const data = await apiFetch<MemberStats>("/admin/analytics/member-stats");
    set({ memberStats: data });
  },

  fetchTrends: async () => {
    const data = await apiFetch<TrendData[]>("/admin/analytics/trends");
    set({ trends: data });
  },

  fetchRecommendations: async () => {
    const data = await apiFetch<RecommendationRule[]>("/admin/recommendations");
    set({ recommendations: data });
  },

  approveMember: async (id: string) => {
    await apiCall(`/organization/members/${id}/approve`, { method: "PUT" });
    const members = get().members.map((m) =>
      m.id === id ? { ...m, status: "active" as const } : m
    );
    set({ members });
  },

  rejectMember: async (id: string, reason?: string) => {
    await apiCall(`/organization/members/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
    const members = get().members.map((m) =>
      m.id === id ? { ...m, status: "rejected" as const } : m
    );
    set({ members });
  },

  verifyMember: async (idCard: string, employeeNo: string) => {
    return apiCall("/organization/members/verify", {
      method: "POST",
      body: JSON.stringify({ idCard, employeeNo }),
    });
  },

  approveBudget: async (id: string, comment?: string) => {
    await apiCall(`/benefits/budgets/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  },

  rejectBudget: async (id: string, comment?: string) => {
    await apiCall(`/benefits/budgets/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    });
  },

  fetchBudgetDetail: async (id: string) => {
    try {
      const data = await apiFetch<BudgetDetail>(`/benefits/budgets/${id}/details`);
      set((s) => ({ budgetDetails: { ...s.budgetDetails, [id]: data } }));
      return data;
    } catch {
      return null;
    }
  },

  redeemVoucher: async (id: string, memberId: string) => {
    const res = await apiCall(`/benefits/vouchers/${id}/redeem`, {
      method: "POST",
      body: JSON.stringify({ memberId, operatorName: "系统管理员" }),
    });
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const myVouchers = get().myVouchers.map((v) =>
      v.id === id ? { ...v, status: "used" as const, usedAt: res.data?.usedAt || now, serialNo: res.data?.serialNo, operatorName: res.data?.operatorName } : v
    );
    set({ myVouchers });
    return res;
  },

  batchRedeemVouchers: async (voucherIds: string[], memberId: string) => {
    const res = await apiCall("/benefits/vouchers/batch-redeem", {
      method: "POST",
      body: JSON.stringify({ voucherIds, memberId, operatorName: "系统管理员" }),
    });
    if (res.success && res.data?.results) {
      const resultMap: Record<string, any> = {};
      for (const r of res.data.results) {
        resultMap[r.id] = r;
      }
      const myVouchers = get().myVouchers.map((v) =>
        voucherIds.includes(v.id) && resultMap[v.id]
          ? { ...v, status: "used" as const, usedAt: resultMap[v.id].usedAt, serialNo: resultMap[v.id].serialNo, operatorName: res.data.operatorName }
          : v
      );
      set({ myVouchers });
    }
    return res;
  },

  exchangePoints: async (memberId: string, productId: string) => {
    return apiCall("/benefits/points/exchange", {
      method: "POST",
      body: JSON.stringify({ memberId, productId }),
    });
  },

  approveSupplier: async (id: string) => {
    await apiCall(`/admin/suppliers/${id}/approve`, { method: "PUT" });
    const suppliers = get().suppliers.map((s) =>
      s.id === id ? { ...s, status: "approved" as const } : s
    );
    set({ suppliers });
  },

  assessSupplier: async (id: string, score: number, comment: string, assessor: string) => {
    await apiCall(`/admin/suppliers/${id}/assess`, {
      method: "POST",
      body: JSON.stringify({ score, comment, assessor }),
    });
  },

  toggleRecommendation: async (id: string, enabled: boolean) => {
    await apiCall(`/admin/recommendations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
    const recommendations = get().recommendations.map((r) =>
      r.id === id ? { ...r, enabled } : r
    );
    set({ recommendations });
  },
}));
