import { create } from 'zustand';
import type { User, UserRole, DesensitizedUser } from '@/types/entity';
import { storage } from '@/utils/storage';
import { hasRole, hasAnyRole, hasPermission as checkPermission } from '@/utils/permission';

interface UserState {
  user: User | null;
  desensitizedUser: DesensitizedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
  hasRole: (requiredRole: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  setLoading: (loading: boolean) => void;
}

const initialToken = storage.get<string>('token');
const initialUser = storage.get<User>('user');

export const useUserStore = create<UserState>((set, get) => ({
  user: initialUser || null,
  desensitizedUser: initialUser ? {
    id: initialUser.id,
    username: initialUser.username,
    realName: initialUser.realName,
    phone: initialUser.phone,
    email: initialUser.email,
    idCard: initialUser.idCard,
    avatar: initialUser.avatar,
    role: initialUser.role,
    communityId: initialUser.communityId,
    buildingId: initialUser.buildingId,
    unitId: initialUser.unitId,
    roomId: initialUser.roomId,
  } : null,
  token: initialToken || null,
  isAuthenticated: !!initialToken && !!initialUser,
  isLoading: false,

  setUser: (user) => {
    if (user) {
      storage.set('user', user);
    } else {
      storage.remove('user');
    }
    set({
      user,
      desensitizedUser: user ? {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        idCard: user.idCard,
        avatar: user.avatar,
        role: user.role,
        communityId: user.communityId,
        buildingId: user.buildingId,
        unitId: user.unitId,
        roomId: user.roomId,
      } : null,
    });
  },

  setToken: (token) => {
    if (token) {
      storage.set('token', token);
    } else {
      storage.remove('token');
    }
    set({ token, isAuthenticated: !!token });
  },

  login: (user, token) => {
    storage.set('user', user);
    storage.set('token', token);
    set({
      user,
      desensitizedUser: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        idCard: user.idCard,
        avatar: user.avatar,
        role: user.role,
        communityId: user.communityId,
        buildingId: user.buildingId,
        unitId: user.unitId,
        roomId: user.roomId,
      },
      token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    storage.remove('user');
    storage.remove('token');
    set({
      user: null,
      desensitizedUser: null,
      token: null,
      isAuthenticated: false,
    });
  },

  updateUser: (partialUser) => {
    const { user } = get();
    if (!user) {
      return;
    }
    const updatedUser = { ...user, ...partialUser };
    storage.set('user', updatedUser);
    set({
      user: updatedUser,
      desensitizedUser: {
        id: updatedUser.id,
        username: updatedUser.username,
        realName: updatedUser.realName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        idCard: updatedUser.idCard,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        communityId: updatedUser.communityId,
        buildingId: updatedUser.buildingId,
        unitId: updatedUser.unitId,
        roomId: updatedUser.roomId,
      },
    });
  },

  hasRole: (requiredRole) => {
    const { user } = get();
    return hasRole(user?.role, requiredRole);
  },

  hasAnyRole: (roles) => {
    const { user } = get();
    return hasAnyRole(user?.role, roles);
  },

  hasPermission: (permission) => {
    const { user } = get();
    return checkPermission(user, permission);
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
