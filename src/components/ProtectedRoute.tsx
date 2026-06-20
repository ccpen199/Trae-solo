import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <SkeletonCard withImage lines={4} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard withImage={false} lines={3} />
            <SkeletonCard withImage={false} lines={3} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
