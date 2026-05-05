import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ROLE_LEVELS = {
  ADMIN: 100,
  MODERATOR: 50,
  USER: 10,
  GUEST: 0
};

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (userData, tokenData) => {
        set({
          user: userData,
          token: tokenData,
          isAuthenticated: true
        });
      },

      updateUser: (userData) => {
        const { user } = get();
        set({
          user: { ...user, ...userData }
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        localStorage.removeItem('user-storage');
      },

      getRoleLevel: () => {
        const { user } = get();
        if (!user) return ROLE_LEVELS.GUEST;
        const level = Number(user.roleLevel);
        return isNaN(level) ? ROLE_LEVELS.USER : level;
      },

      isAdmin: () => {
        return get().getRoleLevel() >= ROLE_LEVELS.ADMIN;
      },

      isModerator: () => {
        return get().getRoleLevel() >= ROLE_LEVELS.MODERATOR;
      },

      isOnlyModerator: () => {
        const level = get().getRoleLevel();
        return level >= ROLE_LEVELS.MODERATOR && level < ROLE_LEVELS.ADMIN;
      },

      isRegularUser: () => {
        const level = get().getRoleLevel();
        return level >= ROLE_LEVELS.USER && level < ROLE_LEVELS.MODERATOR;
      },

      getRoleDisplayName: () => {
        const { user } = get();
        if (!user) return '游客';
        const roleMap = {
          admin: '管理员',
          moderator: '版主',
          user: '普通用户',
          guest: '游客'
        };
        return roleMap[user.role] || '用户';
      },

      canManageTopics: () => {
        return get().getRoleLevel() >= ROLE_LEVELS.MODERATOR;
      },

      canManageUsers: () => {
        return get().getRoleLevel() >= ROLE_LEVELS.ADMIN;
      },

      canViewLogs: () => {
        return get().getRoleLevel() >= ROLE_LEVELS.MODERATOR;
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        console.log('用户状态已从存储恢复');
      }
    }
  )
);

export default useUserStore;
