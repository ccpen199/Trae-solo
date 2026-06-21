import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "driver" | "shipper" | "admin";

export interface UserInfo {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  email?: string;
  role: UserRole;
}

interface AppState {
  token: string | null;
  user: UserInfo | null;
  loading: boolean;

  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: Partial<UserInfo>) => void;
  setLoading: (loading: boolean) => void;
  switchRole: (role: UserRole) => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const DEMO_USERS: Record<UserRole, UserInfo> = {
  driver: {
    id: "driver_001",
    username: "driver_demo",
    nickname: "张师傅",
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=driver&backgroundColor=ffd5dc,ffdfbf,c0aede,d1d4f9",
    phone: "13800138001",
    role: "driver",
  },
  shipper: {
    id: "shipper_001",
    username: "shipper_demo",
    nickname: "顺通货主",
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=shipper&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc",
    phone: "13900139001",
    email: "shipper@demo.com",
    role: "shipper",
  },
  admin: {
    id: "admin_001",
    username: "admin_demo",
    nickname: "超级管理员",
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=admin&backgroundColor=c0aede,d1d4f9,b6e3f4,ffdfbf",
    phone: "13700137001",
    email: "admin@demo.com",
    role: "admin",
  },
};

const ROLE_DEMO_TOKEN: Record<UserRole, string> = {
  driver: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZHJpdmVyIiwiZXhwIjo5OTk5OTk5OTk5fQ.demo_driver_token",
  shipper: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2hpcHBlciIsImV4cCI6OTk5OTk5OTk5OX0.demo_shipper_token",
  admin: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.demo_admin_token",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,

      login: (token: string, user: UserInfo) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("app_token", token);
        }
        set({ token, user, loading: false });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("app_token");
        }
        set({ token: null, user: null, loading: false });
      },

      setToken: (token: string) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("app_token", token);
        }
        set({ token });
      },

      setUser: (user: Partial<UserInfo>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : (user as UserInfo),
        }));
      },

      setLoading: (loading: boolean) => set({ loading }),

      switchRole: (role: UserRole) => {
        const demoUser = { ...DEMO_USERS[role] };
        const demoToken = ROLE_DEMO_TOKEN[role];

        if (typeof window !== "undefined") {
          localStorage.setItem("app_token", demoToken);
        }

        set({ token: demoToken, user: demoUser, loading: false });
      },

      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },

      hasRole: (role) => {
        const state = get();
        if (!state.user) return false;
        if (Array.isArray(role)) {
          return role.includes(state.user.role);
        }
        return state.user.role === role;
      },
    }),
    {
      name: "app_store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined" && state?.token) {
          localStorage.setItem("app_token", state.token);
        }
      },
    }
  )
);

export const selectToken = (state: AppState) => state.token;
export const selectUser = (state: AppState) => state.user;
export const selectUserRole = (state: AppState) => state.user?.role;
export const selectIsAuthenticated = (state: AppState) => !!state.token && !!state.user;
export const selectLoading = (state: AppState) => state.loading;

export const getDefaultRouteByRole = (role?: UserRole | null): string => {
  switch (role) {
    case "driver":
      return "/driver/home";
    case "shipper":
      return "/shipper/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/driver/home";
  }
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    driver: "司机端",
    shipper: "货主端",
    admin: "运营端",
  };
  return labels[role];
};

export const getAllRoles = (): UserRole[] => ["driver", "shipper", "admin"];
