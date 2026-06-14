import { createContext, useContext, useEffect, useState } from 'react';
import { useOrderStore } from '@/store/orderStore';
import { useDispatchStore } from '@/store/dispatchStore';
import { useAuthStore } from '@/store/authStore';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

const AppCtx = createContext<null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const initOrders = useOrderStore((s) => s.init);
  const initDispatch = useDispatchStore((s) => s.init);
  const loading = useOrderStore((s) => s.loading);

  useEffect(() => {
    initOrders();
    initDispatch();
  }, [initOrders, initDispatch]);

  return (
    <AppCtx.Provider value={null}>
      {loading ? (
        <div className="flex items-center justify-center h-screen w-screen text-slate-400 font-display">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-ink-600" />
              <div
                className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"
                style={{ animationDuration: '1s' }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-cyan-500 border-b-transparent animate-spin"
                style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
              />
            </div>
            <div className="text-sm tracking-widest text-slate-500">INITIALIZING FLEET CONTROL...</div>
          </div>
        </div>
      ) : (
        children
      )}
    </AppCtx.Provider>
  );
}

export function useAppCtx() {
  return useContext(AppCtx);
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setChecking(false);
      return;
    }
    const restored = restoreSession();
    if (!restored) {
      setChecking(false);
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, restoreSession]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen w-screen text-slate-400 font-display">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-ink-600 border-t-orange-500 rounded-full animate-spin" />
          <div className="text-xs tracking-widest text-slate-500">VERIFYING SESSION...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const defaultRoute =
      user.role === 'SHIPPER'
        ? '/shipper/dashboard'
        : user.role === 'DRIVER'
          ? '/driver/dashboard'
          : '/admin/overview';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
