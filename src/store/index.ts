import { create } from "zustand";
import type { User, DriverProfile, UserRole } from "@shared/types";

interface AuthState {
  token: string | null;
  user: User | null;
  driverProfile: DriverProfile | null;
  login: (data: {
    token: string;
    user: User;
    driverProfile?: DriverProfile | null;
  }) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") as string)
    : null,
  driverProfile: localStorage.getItem("driverProfile")
    ? JSON.parse(localStorage.getItem("driverProfile") as string)
    : null,
  login: (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.driverProfile) {
      localStorage.setItem(
        "driverProfile",
        JSON.stringify(data.driverProfile)
      );
    }
    set({
      token: data.token,
      user: data.user,
      driverProfile: data.driverProfile || null,
    });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("driverProfile");
    set({ token: null, user: null, driverProfile: null });
  },
  setRole: () => {},
}));
