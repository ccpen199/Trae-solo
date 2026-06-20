import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import { UserRole } from '@shared/types';
import { useAuthStore, selectIsAuthenticated, selectUser } from './store/authStore';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { Skeleton } from './components/ui/Skeleton';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import HotelDetailPage from './pages/HotelDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import ItinerariesPage from './pages/ItinerariesPage';
import SharedItineraryPage from './pages/SharedItineraryPage';
import MemberCenterPage from './pages/MemberCenterPage';
import GDPRPage from './pages/GDPRPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRole,
}) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      useAuthStore.getState().getCurrentUser();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Skeleton variant="circular" className="w-16 h-16 mx-auto mb-4" />
            <Skeleton variant="text" width={200} className="mx-auto" />
            <p className="text-graphite-500 mt-2">加载中...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && user && !requireRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();
  const from = (location.state as any)?.from || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const NotFoundPage: React.FC = () => {
  const navigate = useRouterNavigate();
  return (
    <MainLayout>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-deep-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-graphite-900 mb-3">
          页面未找到
        </h1>
        <p className="text-graphite-500 mb-8">
          您访问的页面不存在或已被移除。
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-deep-blue text-white rounded-lg hover:bg-deep-blue-light transition-colors"
        >
          返回首页
        </button>
      </div>
    </MainLayout>
  );
};

const AppRoutes: React.FC = () => {
  useEffect(() => {
    const initAuth = async () => {
      const state = useAuthStore.getState();
      if (state.accessToken && !state.user) {
        await state.getCurrentUser();
      }
    };
    initAuth();
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />

      <Route
        path="/search"
        element={
          <MainLayout>
            <SearchResultsPage />
          </MainLayout>
        }
      />

      <Route
        path="/hotel/:id"
        element={
          <MainLayout>
            <HotelDetailPage />
          </MainLayout>
        }
      />

      <Route
        path="/itinerary/shared/:token"
        element={
          <MainLayout>
            <SharedItineraryPage />
          </MainLayout>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <MainLayout>
              <LoginPage />
            </MainLayout>
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <MainLayout>
              <RegisterPage />
            </MainLayout>
          </PublicRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BookingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BookingDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/itineraries"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ItinerariesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/member"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MemberCenterPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gdpr"
        element={
          <ProtectedRoute>
            <MainLayout>
              <GDPRPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hotel-admin"
        element={
          <ProtectedRoute
            requireRole={[UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF]}
          >
            <MainLayout>
              <div className="max-w-6xl mx-auto px-4 py-12 text-center">
                <h1 className="text-3xl font-display font-bold text-graphite-900 mb-4">
                  酒店管理后台
                </h1>
                <p className="text-graphite-500 mb-8">
                  酒店管理后台正在开发中，敬请期待
                </p>
                <img
                  src="https://images.unsplash.com/photo-1556740755-069a40165b40?w=600&h=400&fit=crop"
                  alt="Hotel Admin"
                  className="rounded-2xl shadow-lg mx-auto max-w-lg"
                />
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            requireRole={[UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]}
          >
            <MainLayout>
              <div className="max-w-6xl mx-auto px-4 py-12 text-center">
                <h1 className="text-3xl font-display font-bold text-graphite-900 mb-4">
                  平台运营后台
                </h1>
                <p className="text-graphite-500 mb-8">
                  平台运营后台正在开发中，敬请期待
                </p>
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                  alt="Platform Admin"
                  className="rounded-2xl shadow-lg mx-auto max-w-lg"
                />
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}
