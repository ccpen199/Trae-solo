import { create } from 'zustand';

const useUIStore = create((set) => ({
  isPlayerExpanded: false,
  isSidebarOpen: false,
  currentToast: null,
  loadingStates: {},
  errorStates: {},

  setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
  togglePlayerExpanded: () => set((state) => ({ isPlayerExpanded: !state.isPlayerExpanded })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  showToast: (message, type = 'info', duration = 3000) => {
    set({ currentToast: { message, type } });
    setTimeout(() => set({ currentToast: null }), duration);
  },
  hideToast: () => set({ currentToast: null }),

  setLoading: (key, isLoading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: isLoading }
  })),

  setError: (key, error) => set((state) => ({
    errorStates: { ...state.errorStates, [key]: error }
  })),

  clearError: (key) => set((state) => {
    const newErrors = { ...state.errorStates };
    delete newErrors[key];
    return { errorStates: newErrors };
  }),
}));

export default useUIStore;
