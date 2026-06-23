import { create } from "zustand";
import type { User, HealthProfile } from "@/types";

const mockUser: User = {
  id: "user-001",
  phone: "13800138000",
  name: "王大爷",
  age: 68,
  role: "elder",
  accessibilityConfig: {
    fontSize: "large",
    contrast: "normal",
    voiceEnabled: true,
    voiceGender: "female",
    voiceRate: 0.9,
  },
  createdAt: "2024-01-15T08:00:00Z",
  lastLogin: new Date().toISOString(),
};

const mockHealthProfile: HealthProfile = {
  userId: "user-001",
  chronicDiseases: ["hypertension"],
  dietPreference: "低盐低脂",
  exerciseLevel: 2,
  allergies: ["青霉素"],
};

interface UserState {
  currentUser: User | null;
  isLoggedIn: boolean;
  healthProfile: HealthProfile | null;
  login: () => void;
  logout: () => void;
  updateHealthProfile: (profile: Partial<HealthProfile>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: mockUser,
  isLoggedIn: true,
  healthProfile: mockHealthProfile,

  login: () => {
    set({
      currentUser: mockUser,
      isLoggedIn: true,
      healthProfile: mockHealthProfile,
    });
  },

  logout: () => {
    set({
      currentUser: null,
      isLoggedIn: false,
      healthProfile: null,
    });
  },

  updateHealthProfile: (profile) => {
    set((state) => ({
      healthProfile: state.healthProfile
        ? { ...state.healthProfile, ...profile }
        : (profile as HealthProfile),
    }));
  },
}));
