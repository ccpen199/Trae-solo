import { create } from 'zustand';
import { User, Resume, ResumeContent, Template, DeliveryRecord, QualityReport } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  resumes: Resume[];
  currentResume: Resume | null;
  templates: Template[];
  deliveries: DeliveryRecord[];
  qualityReport: QualityReport | null;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setResumes: (resumes: Resume[]) => void;
  setCurrentResume: (resume: Resume | null) => void;
  setTemplates: (templates: Template[]) => void;
  setDeliveries: (deliveries: DeliveryRecord[]) => void;
  setQualityReport: (report: QualityReport | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  
  updateResumeContent: (updates: Partial<ResumeContent>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  resumes: [],
  currentResume: null,
  templates: [],
  deliveries: [],
  qualityReport: null,
  isLoading: false,
  
  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },
  
  setToken: (token) => {
    set({ token });
    if (token) localStorage.setItem('token', token);
  },
  
  setResumes: (resumes) => set({ resumes }),
  setCurrentResume: (currentResume) => set({ currentResume }),
  setTemplates: (templates) => set({ templates }),
  setDeliveries: (deliveries) => set({ deliveries }),
  setQualityReport: (qualityReport) => set({ qualityReport }),
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, currentResume: null, qualityReport: null });
  },
  
  updateResumeContent: (updates) => {
    const { currentResume } = get();
    if (currentResume) {
      set({
        currentResume: {
          ...currentResume,
          content: { ...currentResume.content, ...updates }
        }
      });
    }
  }
}));
