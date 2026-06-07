import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import HomePage from "@/pages/HomePage";
import CargoList from "@/pages/CargoList";
import CargoPublish from "@/pages/CargoPublish";
import VehicleList from "@/pages/VehicleList";
import VehiclePublish from "@/pages/VehiclePublish";
import RouteList from "@/pages/RouteList";
import MatchingPage from "@/pages/MatchingPage";
import TrackingList from "@/pages/TrackingList";
import TrackingDetail from "@/pages/TrackingDetail";
import ContractList from "@/pages/ContractList";
import CreditPage from "@/pages/CreditPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminPage from "@/pages/AdminPage";
import { useAuthStore } from "@/stores/auth";

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F6FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E8722A] border-t-transparent" />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F5F6FA]">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">无权限访问</h2>
        <p className="text-gray-500 mb-4">当前用户角色不具备访问此页面的权限</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cargo"
          element={
            <ProtectedRoute>
              <CargoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cargo/publish"
          element={
            <ProtectedRoute allowedRoles={["shipper", "admin"]}>
              <CargoPublish />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle"
          element={
            <ProtectedRoute>
              <VehicleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle/publish"
          element={
            <ProtectedRoute allowedRoles={["driver", "admin"]}>
              <VehiclePublish />
            </ProtectedRoute>
          }
        />
        <Route
          path="/route"
          element={
            <ProtectedRoute>
              <RouteList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching"
          element={
            <ProtectedRoute>
              <MatchingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <TrackingList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking/:id"
          element={
            <ProtectedRoute>
              <TrackingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contract"
          element={
            <ProtectedRoute>
              <ContractList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit"
          element={
            <ProtectedRoute>
              <CreditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "shipper", "carrier"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
