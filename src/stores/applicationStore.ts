import { create } from 'zustand';
import type { Application } from '@/types';
import { mockApplications } from '@/mock/data';

interface ApplicationState {
  applications: Application[];
  addApplication: (app: Application) => void;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
  getApplicationsByUser: (userId: string) => Application[];
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: mockApplications,
  addApplication: (app) => set((state) => ({ applications: [...state.applications, app] })),
  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString().split('T')[0] } : a)),
    })),
  getApplicationsByUser: (userId) => get().applications.filter((a) => a.userId === userId),
}));
