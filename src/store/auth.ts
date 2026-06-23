import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, LoginResponse } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (data: LoginResponse) => {
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      },
      setUser: (user: User) => {
        set({ user });
        localStorage.setItem("user", JSON.stringify(user));
      },
      updateToken: (token: string) => {
        set({ token });
        localStorage.setItem("token", token);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
