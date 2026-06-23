import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { mockUser, mockSocialCard } from '@/data/mock';
import type { UserInfo, SocialCard, CardStatus } from '@/types';

interface AuthState {
  isLoggedIn: boolean;
  user: UserInfo | null;
  card: SocialCard;
  login: (user: UserInfo) => void;
  logout: () => void;
  updateCardStatus: (status: CardStatus) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(mockUser);
  const [card, setCard] = useState<SocialCard>({ ...mockSocialCard });

  const login = useCallback((u: UserInfo) => {
    setUser(u);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    setCard({ ...mockSocialCard });
  }, []);

  const updateCardStatus = useCallback((status: CardStatus) => {
    setCard((prev) => ({ ...prev, status }));
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, card, login, logout, updateCardStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
