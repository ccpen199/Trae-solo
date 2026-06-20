import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ArtistProfile, UserRole } from '@shared/types';
import { mockCurrentUser, mockCurrentArtistProfile, mockAgencies, mockArtists } from '../data/mockData';

interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  artistProfile: ArtistProfile | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  setArtistProfile: (profile: ArtistProfile | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const mockUsers: Record<UserRole, User & { password: string }> = {
  artist: {
    ...mockCurrentUser,
    id: 'user-artist-001',
    email: 'artist@example.com',
    phone: '13800138001',
    role: 'artist',
    password: 'password123',
  },
  agency_admin: {
    ...mockCurrentUser,
    id: 'user-agency-001',
    email: 'admin@xingyao.com',
    phone: '13900139001',
    role: 'agency_admin',
    password: 'password123',
  },
  company_hr: {
    ...mockCurrentUser,
    id: 'user-company-001',
    email: 'hr@luxe.com',
    phone: '13700137001',
    role: 'company_hr',
    password: 'password123',
  },
  admin: {
    ...mockCurrentUser,
    id: 'user-admin-001',
    email: 'admin@talenthub.com',
    phone: '18600186001',
    role: 'admin',
    password: 'admin123',
  },
  platform: {
    ...mockCurrentUser,
    id: 'user-platform-001',
    email: 'platform@talenthub.com',
    phone: '18700187001',
    role: 'platform',
    password: 'platform123',
  },
  ops: {
    ...mockCurrentUser,
    id: 'user-ops-001',
    email: 'ops@talenthub.com',
    phone: '18800188001',
    role: 'ops',
    password: 'ops123',
  },
};

const getRoleUserProfile = (role: UserRole, email: string, phone: string) => {
  let matchedUser = Object.values(mockUsers).find(
    (u) => (email && u.email === email) || (phone && u.phone === phone)
  );

  if (!matchedUser) {
    const defaultUser = mockUsers[role];
    matchedUser = {
      ...defaultUser,
      email: email || defaultUser.email,
      phone: phone || defaultUser.phone,
    };
  }

  const user: User = {
    id: matchedUser.id,
    email: matchedUser.email,
    phone: matchedUser.phone,
    role: role,
    isVerified: true,
    createdAt: new Date(),
  };

  let profile: ArtistProfile | null = null;
  if (role === 'artist') {
    profile = {
      ...mockCurrentArtistProfile,
      userId: user.id,
    };
  }

  return { user, profile };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      artistProfile: null,

      login: async ({ email, phone, password, role }) => {
        set({ isLoading: true, error: null });

        try {
          await new Promise((resolve) => setTimeout(resolve, 800));

          if (!email && !phone) {
            set({ isLoading: false, error: '请输入邮箱或手机号' });
            return false;
          }

          if (!password) {
            set({ isLoading: false, error: '请输入密码' });
            return false;
          }

          const matchedUser = Object.values(mockUsers).find(
            (u) =>
              ((email && u.email === email) || (phone && u.phone === phone)) &&
              u.password === password
          );

          if (!matchedUser) {
            set({
              isLoading: false,
              error: '账号或密码错误，请检查后重试',
            });
            return false;
          }

          if (matchedUser.role !== role) {
            const roleNames: Record<UserRole, string> = {
              artist: '艺人/模特',
              agency_admin: '经纪公司',
              company_hr: '企业HR',
              admin: '系统管理员',
              platform: '平台运营',
              ops: '运维人员',
            };
            set({
              isLoading: false,
              error: `该账号属于「${roleNames[matchedUser.role]}」角色，但您选择了「${roleNames[role]}」，请选择正确的登录角色`,
            });
            return false;
          }

          const { user, profile } = getRoleUserProfile(
            role,
            email || '',
            phone || ''
          );

          set({
            user,
            token: 'jwt-token-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10),
            isAuthenticated: true,
            isLoading: false,
            error: null,
            artistProfile: profile,
          });

          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: '登录失败，请稍后重试',
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          artistProfile: null,
        });
        localStorage.removeItem('auth-storage');
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (!userData.email && !userData.phone) {
            set({ isLoading: false, error: '请输入邮箱或手机号' });
            return false;
          }

          const newUser: User = {
            id: 'user-' + Date.now(),
            email: userData.email || '',
            phone: userData.phone || '',
            role: (userData.role as UserRole) || 'artist',
            isVerified: false,
            createdAt: new Date(),
          };

          let profile: ArtistProfile | null = null;
          if (newUser.role === 'artist') {
            profile = {
              ...mockCurrentArtistProfile,
              id: 'profile-' + Date.now(),
              userId: newUser.id,
            };
          }

          set({
            user: newUser,
            token: 'jwt-token-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
            error: null,
            artistProfile: profile,
          });

          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: '注册失败，请稍后重试',
          });
          return false;
        }
      },

      updateProfile: async (updates) => {
        set({ isLoading: true });
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));

          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));

          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token && parsed.state?.user) {
              const role = parsed.state.user.role as UserRole;
              let profile: ArtistProfile | null = null;
              if (role === 'artist') {
                profile = {
                  ...mockCurrentArtistProfile,
                  userId: parsed.state.user.id,
                };
              }

              set({
                isLoading: false,
                isAuthenticated: true,
                user: parsed.state.user,
                token: parsed.state.token,
                artistProfile: profile,
              });
              return true;
            }
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      setArtistProfile: (profile) => {
        set({ artistProfile: profile });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
