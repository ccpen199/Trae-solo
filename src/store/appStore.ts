import { create } from 'zustand';

export type ModalType =
  | 'login'
  | 'register'
  | 'uploadArtwork'
  | 'selectExpert'
  | 'appraisalResult'
  | 'certificatePreview'
  | 'disputeSubmit'
  | null;

interface AppState {
  currentPage: string;
  modalType: ModalType;
  modalData: Record<string, unknown> | null;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  loadingStack: number;
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;
  setCurrentPage: (page: string) => void;
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  toggleSidebar: (open?: boolean) => void;
  toggleTheme: () => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    duration?: number,
  ) => void;
  hideToast: () => void;
  pushLoading: () => void;
  popLoading: () => void;
  get isLoading(): boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: '/',
  modalType: null,
  modalData: null,
  isSidebarOpen: false,
  theme: 'light',
  loadingStack: 0,
  toast: null,

  setCurrentPage: (page: string) => {
    set({ currentPage: page });
  },

  openModal: (type: ModalType, data?: Record<string, unknown>) => {
    set({ modalType: type, modalData: data || null });
  },

  closeModal: () => {
    set({ modalType: null, modalData: null });
  },

  toggleSidebar: (open?: boolean) => {
    set((state) => ({
      isSidebarOpen: typeof open === 'boolean' ? open : !state.isSidebarOpen,
    }));
  },

  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    }));
  },

  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 3000,
  ) => {
    set({
      toast: { message, type, visible: true },
    });
    if (duration > 0) {
      setTimeout(() => {
        set({ toast: null });
      }, duration);
    }
  },

  hideToast: () => {
    set({ toast: null });
  },

  pushLoading: () => {
    set((state) => ({ loadingStack: state.loadingStack + 1 }));
  },

  popLoading: () => {
    set((state) => ({
      loadingStack: Math.max(0, state.loadingStack - 1),
    }));
  },

  get isLoading() {
    return get().loadingStack > 0;
  },
}));
