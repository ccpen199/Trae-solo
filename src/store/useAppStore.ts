import { create } from 'zustand';
import type { DiagnosisReport, JobFilters, UserProfile } from '@shared/types';

export type AppRole = 'jobseeker' | 'hr';

interface AppUser {
  isLoggedIn: boolean;
  profile: UserProfile | null;
  token: string | null;
}

interface AppState {
  user: AppUser;
  currentDiagnosisReport: DiagnosisReport | null;
  jobFilters: JobFilters;
  role: AppRole;
}

interface AppActions {
  setUser: (user: Partial<AppUser> | null) => void;
  setDiagnosisReport: (report: DiagnosisReport | null) => void;
  updateJobFilters: (filters: Partial<JobFilters>) => void;
  switchRole: (role: AppRole) => void;
  logout: () => void;
}

const getInitialUser = (): AppUser => {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, profile: null, token: null };
  }
  const token = localStorage.getItem('auth_token');
  const profileStr = localStorage.getItem('user_profile');
  const profile = profileStr ? (JSON.parse(profileStr) as UserProfile) : null;
  return {
    isLoggedIn: !!token,
    profile,
    token,
  };
};

const getInitialRole = (): AppRole => {
  if (typeof window === 'undefined') return 'jobseeker';
  const savedRole = localStorage.getItem('app_role') as AppRole | null;
  if (savedRole === 'jobseeker' || savedRole === 'hr') return savedRole;
  return 'jobseeker';
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  user: getInitialUser(),
  currentDiagnosisReport: null,
  jobFilters: {
    keyword: '',
    cities: [],
    salaryMin: undefined,
    salaryMax: undefined,
    industries: [],
    growthTags: [],
    jobLevels: [],
    sortBy: 'match',
  },
  role: getInitialRole(),

  setUser: (user) => {
    if (user === null) {
      set({ user: { isLoggedIn: false, profile: null, token: null } });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      return;
    }

    const currentUser = get().user;
    const updated: AppUser = { ...currentUser, ...user };

    if (user.token !== undefined) {
      if (user.token) {
        localStorage.setItem('auth_token', user.token);
        updated.isLoggedIn = true;
      } else {
        localStorage.removeItem('auth_token');
        updated.isLoggedIn = false;
      }
    }

    if (user.profile !== undefined) {
      if (user.profile) {
        localStorage.setItem('user_profile', JSON.stringify(user.profile));
        const profileRole = user.profile.role;
        if (profileRole === 'jobseeker' || profileRole === 'hr') {
          localStorage.setItem('app_role', profileRole);
          set({ role: profileRole });
        }
      } else {
        localStorage.removeItem('user_profile');
      }
    }

    set({ user: updated });
  },

  setDiagnosisReport: (report) => {
    set({ currentDiagnosisReport: report });
    if (report && typeof window !== 'undefined') {
      localStorage.setItem('last_diagnosis_report', JSON.stringify(report));
    }
  },

  updateJobFilters: (filters) => {
    set((state) => ({
      jobFilters: { ...state.jobFilters, ...filters },
    }));
  },

  switchRole: (role) => {
    set({ role });
    localStorage.setItem('app_role', role);
  },

  logout: () => {
    set({
      user: { isLoggedIn: false, profile: null, token: null },
      currentDiagnosisReport: null,
    });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('last_diagnosis_report');
  },
}));
