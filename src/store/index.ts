import { create } from "zustand";
import type {
  User,
  ServiceItem,
  ApplicationCase,
  Certificate,
  ServiceDomain,
} from "@/types";
import {
  mockUser,
  mockAdminUser,
  mockServices,
  mockCases,
  mockCertificates,
} from "@/data/mockData";

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  currentView: "citizen" | "admin";
  services: ServiceItem[];
  cases: ApplicationCase[];
  certificates: Certificate[];
  selectedDomain: ServiceDomain | "all";
  searchKeyword: string;

  setUser: (user: User) => void;
  clearUser: () => void;
  login: (userType?: "citizen" | "admin") => void;
  logout: () => void;
  switchView: (view: "citizen" | "admin") => void;
  setSelectedDomain: (domain: ServiceDomain | "all") => void;
  setSearchKeyword: (keyword: string) => void;
  addCase: (caseItem: ApplicationCase) => void;
  updateCase: (id: string, updates: Partial<ApplicationCase>) => void;
  getFilteredServices: () => ServiceItem[];
  getCaseById: (id: string) => ApplicationCase | undefined;
  getCertificateById: (id: string) => Certificate | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  currentView: "citizen",
  services: mockServices,
  cases: mockCases,
  certificates: mockCertificates,
  selectedDomain: "all",
  searchKeyword: "",

  setUser: (u) => set({ user: u, isLoggedIn: true, currentView: u.userType === "admin" ? "admin" : "citizen" }),
  clearUser: () => set({ user: null, isLoggedIn: false }),

  login: (userType = "citizen") => {
    const u = userType === "citizen" ? mockUser : mockAdminUser;
    set({
      user: u,
      isLoggedIn: true,
      currentView: userType,
    });
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },

  switchView: (view) => set({ currentView: view }),

  setSelectedDomain: (domain) => set({ selectedDomain: domain }),

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addCase: (caseItem) =>
    set((state) => ({ cases: [caseItem, ...state.cases] })),

  updateCase: (id, updates) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  getFilteredServices: () => {
    const { services, selectedDomain, searchKeyword } = get();
    return services.filter((s) => {
      const domainMatch =
        selectedDomain === "all" || s.category === selectedDomain;
      const keywordMatch =
        !searchKeyword ||
        s.name.includes(searchKeyword) ||
        s.description.includes(searchKeyword) ||
        s.department.includes(searchKeyword);
      return domainMatch && keywordMatch;
    });
  },

  getCaseById: (id) => get().cases.find((c) => c.id === id),

  getCertificateById: (id) => get().certificates.find((c) => c.id === id),
}));
