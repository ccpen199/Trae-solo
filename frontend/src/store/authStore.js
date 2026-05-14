import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('duoshan_token') || null,
  user: JSON.parse(localStorage.getItem('duoshan_user') || 'null'),
  
  login: (token, user) => {
    localStorage.setItem('duoshan_token', token);
    localStorage.setItem('duoshan_user', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('duoshan_token');
    localStorage.removeItem('duoshan_user');
    set({ token: null, user: null });
  },
  
  updateUser: (userData) => {
    const currentUser = JSON.parse(localStorage.getItem('duoshan_user') || '{}');
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('duoshan_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  }
}));

export default useAuthStore;
