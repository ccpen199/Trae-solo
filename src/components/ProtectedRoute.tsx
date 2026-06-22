import { Navigate, useLocation, Location } from "react-router-dom";
import { useUserStore } from "@/store/user";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 text-sm">加载中...</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated: boolean = useUserStore((state) => state.isAuthenticated);
  const hasHydrated: boolean = useUserStore((state) => state._hasHydrated);
  const location: Location = useLocation();

  if (!hasHydrated) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated: boolean = useUserStore((state) => state.isAuthenticated);
  const hasHydrated: boolean = useUserStore((state) => state._hasHydrated);

  if (!hasHydrated) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
