import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NewsList from "@/pages/NewsList";
import NewsCreate from "@/pages/NewsCreate";
import ServicesPage from "@/pages/ServicesPage";
import ComplaintsPage from "@/pages/ComplaintsPage";
import MediaPage from "@/pages/MediaPage";
import PoiPage from "@/pages/PoiPage";
import ReviewPage from "@/pages/ReviewPage";
import OpinionPage from "@/pages/OpinionPage";
import CreditsPage from "@/pages/CreditsPage";
import { useAuth } from "@/stores/auth";

const rolePermissions: Record<string, string[]> = {
  '/': ['admin', 'editor', 'user'],
  '/news': ['admin', 'editor'],
  '/news/create': ['admin', 'editor'],
  '/news/edit/:id': ['admin', 'editor'],
  '/services': ['admin', 'editor', 'user'],
  '/complaints': ['admin', 'editor', 'user'],
  '/media': ['admin', 'editor'],
  '/poi': ['admin', 'editor', 'user'],
  '/review': ['admin', 'editor'],
  '/opinion': ['admin', 'editor'],
  '/credits': ['admin'],
};

function getPathPattern(pathname: string): string {
  if (pathname.startsWith('/news/edit/')) return '/news/edit/:id';
  return pathname;
}

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const pattern = getPathPattern(location.pathname);
  const allowedRoles = rolePermissions[pattern];

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<RoleProtectedRoute><Dashboard /></RoleProtectedRoute>} />
        <Route path="/news" element={<RoleProtectedRoute><NewsList /></RoleProtectedRoute>} />
        <Route path="/news/create" element={<RoleProtectedRoute><NewsCreate /></RoleProtectedRoute>} />
        <Route path="/news/edit/:id" element={<RoleProtectedRoute><NewsCreate /></RoleProtectedRoute>} />
        <Route path="/services" element={<RoleProtectedRoute><ServicesPage /></RoleProtectedRoute>} />
        <Route path="/complaints" element={<RoleProtectedRoute><ComplaintsPage /></RoleProtectedRoute>} />
        <Route path="/media" element={<RoleProtectedRoute><MediaPage /></RoleProtectedRoute>} />
        <Route path="/poi" element={<RoleProtectedRoute><PoiPage /></RoleProtectedRoute>} />
        <Route path="/review" element={<RoleProtectedRoute><ReviewPage /></RoleProtectedRoute>} />
        <Route path="/opinion" element={<RoleProtectedRoute><OpinionPage /></RoleProtectedRoute>} />
        <Route path="/credits" element={<RoleProtectedRoute><CreditsPage /></RoleProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
