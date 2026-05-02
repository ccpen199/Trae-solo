import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  username: string;
  real_name: string;
  role: string;
  department?: string;
  phone?: string;
}

export type UserRole = 'CITIZEN' | 'AUDITOR' | 'WINDOW_STAFF' | 'ADMIN';

export const roleNames: Record<UserRole, string> = {
  CITIZEN: '群众',
  AUDITOR: '审核员',
  WINDOW_STAFF: '窗口人员',
  ADMIN: '管理员',
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role as UserRole);
      }
      return user.role === role;
    },
    [user]
  );

  return {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user && !!token,
  };
};
