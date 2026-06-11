import { create } from 'zustand';
import type { User, UserRole, EnterpriseUser } from '@/types';
import { mockUser, mockEnterpriseUser, mockAdminUser } from '@/mock/data';

interface UserState {
  user: User | null;
  enterpriseUser: EnterpriseUser | null;
  userRole: UserRole;
  isLoggedIn: boolean;
  token: string | null;
  
  login: (role: UserRole) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const validRoles: UserRole[] = ['personal', 'enterprise', 'admin'];
const storedToken = localStorage.getItem('token');
const storedRole = localStorage.getItem('userRole') as UserRole | null;
const initialRole: UserRole = storedRole && validRoles.includes(storedRole) ? storedRole : 'personal';

const getInitialUser = (role: UserRole) => {
  if (!storedToken) {
    return { user: null, enterpriseUser: null };
  }
  if (role === 'enterprise') {
    return { user: { ...mockUser, role: 'enterprise' as const }, enterpriseUser: mockEnterpriseUser };
  }
  if (role === 'admin') {
    return { user: mockAdminUser, enterpriseUser: null };
  }
  return { user: mockUser, enterpriseUser: null };
};

const initialUserState = getInitialUser(initialRole);

export const useUserStore = create<UserState>((set) => ({
  user: initialUserState.user,
  enterpriseUser: initialUserState.enterpriseUser,
  userRole: initialRole,
  isLoggedIn: Boolean(storedToken),
  token: storedToken,

  login: (role: UserRole) => {
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    
    if (role === 'personal') {
      set({ user: mockUser, isLoggedIn: true, userRole: role, token });
    } else if (role === 'enterprise') {
      set({ 
        user: { ...mockUser, role: 'enterprise' }, 
        enterpriseUser: mockEnterpriseUser,
        isLoggedIn: true, 
        userRole: role, 
        token 
      });
    } else if (role === 'admin') {
      set({ user: mockAdminUser, isLoggedIn: true, userRole: role, token });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    set({ user: null, enterpriseUser: null, isLoggedIn: false, token: null });
  },

  setUserRole: (role: UserRole) => {
    set({ userRole: role });
  },
}));
