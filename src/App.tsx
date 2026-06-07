import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CabinetList from "./pages/Cabinets/CabinetList";
import CabinetDetail from "./pages/Cabinets/CabinetDetail";
import CompartmentList from "./pages/Compartments/CompartmentList";
import PackageList from "./pages/Packages/PackageList";
import PackageDetail from "./pages/Packages/PackageDetail";
import ShippingPage from "./pages/Shipping/ShippingPage";
import StoragePage from "./pages/Storage/StoragePage";
import LaundryList from "./pages/Laundry/LaundryList";
import HousekeepingList from "./pages/Housekeeping/HousekeepingList";
import CabinetMonitor from "./pages/Admin/CabinetMonitor";
import QualityBoard from "./pages/Admin/QualityBoard";
import CrossRecommend from "./pages/Admin/CrossRecommend";
import NotificationList from "./pages/Notifications/NotificationList";
import CouponCenter from "./pages/Coupons/CouponCenter";
import { useAuthStore } from "./store/authStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cabinets"
          element={
            <ProtectedRoute>
              <CabinetList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cabinets/:id"
          element={
            <ProtectedRoute>
              <CabinetDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compartments"
          element={
            <ProtectedRoute>
              <CompartmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/packages"
          element={
            <ProtectedRoute>
              <PackageList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/packages/:id"
          element={
            <ProtectedRoute>
              <PackageDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipping"
          element={
            <ProtectedRoute>
              <ShippingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/storage"
          element={
            <ProtectedRoute>
              <StoragePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laundry"
          element={
            <ProtectedRoute>
              <LaundryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/housekeeping"
          element={
            <ProtectedRoute>
              <HousekeepingList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cabinet-monitor"
          element={
            <ProtectedRoute>
              <CabinetMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quality-board"
          element={
            <ProtectedRoute>
              <QualityBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cross-recommend"
          element={
            <ProtectedRoute>
              <CrossRecommend />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coupons"
          element={
            <ProtectedRoute>
              <CouponCenter />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
