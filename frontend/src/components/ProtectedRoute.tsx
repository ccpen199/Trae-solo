import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, login } = useAuthStore();
  const location = useLocation();
  const [demoLoginStatus, setDemoLoginStatus] = useState<'idle' | 'pending' | 'failed'>('idle');

  useEffect(() => {
    if (isAuthenticated || demoLoginStatus !== 'idle') return;

    setDemoLoginStatus('pending');
    login('worker', 'worker123').catch(() => {
      setDemoLoginStatus('failed');
    });
  }, [demoLoginStatus, isAuthenticated, login]);

  if (!isAuthenticated && demoLoginStatus !== 'failed') {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">正在进入演示空间...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
