import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@shared/types';

const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent-50 flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-accent-500" />
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutral-800 mb-2">
            访问被拒绝
          </h1>
          <p className="text-neutral-500 mb-6">
            抱歉，您没有权限访问此页面。该页面仅对以下角色开放：
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {allowedRoles.map((role) => (
              <span
                key={role}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium capitalize',
                  role === 'admin' && 'bg-primary-100 text-primary-700',
                  role === 'hr' && 'bg-mint-100 text-mint-700',
                  role === 'talent' && 'bg-accent-100 text-accent-700',
                  role === 'store_manager' && 'bg-neutral-100 text-neutral-700'
                )}
              >
                {role === 'admin'
                  ? '管理员'
                  : role === 'hr'
                  ? 'HR'
                  : role === 'talent'
                  ? '求职者'
                  : '店长'}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上页
            </button>
            <button
              onClick={() => {
                const dashboardPath =
                  user.role === 'admin'
                    ? '/admin/company-review'
                    : user.role === 'hr'
                    ? '/hr/dashboard'
                    : '/talent/jobs';
                window.location.href = dashboardPath;
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all font-medium shadow-card hover:shadow-card-hover"
            >
              <Home className="w-4 h-4" />
              回到首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
