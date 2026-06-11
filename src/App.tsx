import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AccessPage from "@/pages/AccessPage";
import WorkOrderPage from "@/pages/WorkOrderPage";
import MallPage from "@/pages/MallPage";
import SocialPage from "@/pages/SocialPage";
import PropertyDashboard from "@/pages/PropertyDashboard";
import MerchantDashboard from "@/pages/MerchantDashboard";
import RiskPage from "@/pages/RiskPage";
import Profile from "@/pages/Profile";
import { useAuthStore } from "@/store";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children, roles }: { children: ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/access"
            element={
              <ProtectedRoute roles={["owner", "tenant", "property"]}>
                <AccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workorder"
            element={
              <ProtectedRoute roles={["owner", "tenant", "property"]}>
                <WorkOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mall"
            element={
              <ProtectedRoute roles={["owner", "tenant", "visitor"]}>
                <MallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social"
            element={
              <ProtectedRoute roles={["owner", "tenant"]}>
                <SocialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/dashboard"
            element={
              <ProtectedRoute roles={["property"]}>
                <PropertyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/dashboard"
            element={
              <ProtectedRoute roles={["merchant"]}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk"
            element={
              <ProtectedRoute roles={["property"]}>
                <RiskPage />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
