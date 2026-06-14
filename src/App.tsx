import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore, type User } from "@/store/authStore";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import ProjectDetail from "@/pages/ProjectDetail";
import MapView from "@/pages/MapView";
import MyFranchises from "@/pages/MyFranchises";
import RiskReport from "@/pages/RiskReport";
import Login from "@/pages/Login";
import Disputes from "@/pages/Disputes";
import BrandDashboard from "@/pages/brand/Dashboard";
import BrandProjects from "@/pages/brand/Projects";
import BrandFranchisees from "@/pages/brand/Franchisees";
import AdminProjectReview from "@/pages/admin/ProjectReview";
import AdminContracts from "@/pages/admin/Contracts";
import AdminDisputes from "@/pages/admin/Disputes";
import AdminPerformance from "@/pages/admin/Performance";
import { Loader2 } from "lucide-react";

function AuthLoader() {
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <p className="text-gray-500">正在加载...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function RequireAuth({
  children,
  allowedRoles,
  withLayout = false,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
  withLayout?: boolean
}) {
  const user = useAuthStore(state => state.user) as User | null;
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/review" replace />;
    } else if (user.role === 'brand') {
      return <Navigate to="/brand/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return withLayout ? <Layout>{children}</Layout> : <>{children}</>;
}

function AutoRedirect() {
  const user = useAuthStore(state => state.user) as User | null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/review" replace />;
  } else if (user.role === 'brand') {
    return <Navigate to="/brand/dashboard" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<AuthLoader />}>
          <Route path="/" element={
            <Home />
          } />
          
          <Route path="/projects" element={
            <Home />
          } />
          
          <Route path="/projects/:id" element={
            <ProjectDetail />
          } />
          
          <Route path="/map" element={
            <RequireAuth allowedRoles={['entrepreneur']}>
              <MapView />
            </RequireAuth>
          } />
          
          <Route path="/my-franchises" element={
            <RequireAuth allowedRoles={['entrepreneur']}>
              <MyFranchises />
            </RequireAuth>
          } />
          
          <Route path="/risk-reports" element={
            <RequireAuth allowedRoles={['entrepreneur']}>
              <RiskReport />
            </RequireAuth>
          } />
          
          <Route path="/risk-reports/:id" element={
            <RequireAuth allowedRoles={['entrepreneur', 'admin']}>
              <RiskReport />
            </RequireAuth>
          } />
          
          <Route path="/disputes" element={
            <RequireAuth allowedRoles={['entrepreneur', 'brand', 'admin']}>
              <Disputes />
            </RequireAuth>
          } />
          
          <Route path="/brand/dashboard" element={
            <RequireAuth allowedRoles={['brand']} withLayout>
              <BrandDashboard />
            </RequireAuth>
          } />
          
          <Route path="/brand/projects" element={
            <RequireAuth allowedRoles={['brand']} withLayout>
              <BrandProjects />
            </RequireAuth>
          } />
          
          <Route path="/brand/franchisees" element={
            <RequireAuth allowedRoles={['brand']} withLayout>
              <BrandFranchisees />
            </RequireAuth>
          } />
          
          <Route path="/admin/review" element={
            <RequireAuth allowedRoles={['admin']}>
              <AdminProjectReview />
            </RequireAuth>
          } />
          
          <Route path="/admin/contracts" element={
            <RequireAuth allowedRoles={['admin']}>
              <AdminContracts />
            </RequireAuth>
          } />
          
          <Route path="/admin/disputes" element={
            <RequireAuth allowedRoles={['admin']}>
              <AdminDisputes />
            </RequireAuth>
          } />
          
          <Route path="/admin/performance" element={
            <RequireAuth allowedRoles={['admin']}>
              <AdminPerformance />
            </RequireAuth>
          } />
          
          <Route path="*" element={<AutoRedirect />} />
        </Route>
      </Routes>
    </Router>
  );
}
