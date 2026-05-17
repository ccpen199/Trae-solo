import { create } from 'zustand';

const useToastStore = create((set) => ({
  visible: false,
  message: '',

  show: (message, duration = 2000) => {
    set({ visible: true, message });
    setTimeout(() => {
      set({ visible: false, message: '' });
    }, duration);
  },

  hide: () => set({ visible: false, message: '' })
}));

export default useToastStore;
