import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { CampaignsPage } from '@/pages/Campaigns';
import { lazy, Suspense, useEffect } from 'react';

const TemplatesPage = lazy(() => import('@/pages/Templates'));
const AudiencesPage = lazy(() => import('@/pages/Audiences'));
const AnalyticsPage = lazy(() => import('@/pages/Analytics'));
const AdminPage = lazy(() => import('@/pages/Admin'));
const NewCampaignPage = lazy(() => import('@/pages/NewCampaign'));

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-neutral-500">加载中...</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Layout>
                <CampaignsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/campaigns/new"
          element={
            <ProtectedRoute>
              <Layout>
                <NewCampaignPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Layout>
                <TemplatesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audiences"
          element={
            <ProtectedRoute>
              <Layout>
                <AudiencesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
