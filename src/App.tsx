import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import SupplierWorkspace from "@/pages/workspace/SupplierWorkspace";
import BuyerWorkspace from "@/pages/workspace/BuyerWorkspace";
import OperatorWorkspace from "@/pages/workspace/OperatorWorkspace";
import MarketIndex from "@/pages/market/MarketIndex";
import HeatmapPage from "@/pages/market/HeatmapPage";
import TrendPage from "@/pages/market/TrendPage";
import AlertPage from "@/pages/market/AlertPage";
import SupplyList from "@/pages/supplies/SupplyList";
import SupplyDetail from "@/pages/supplies/SupplyDetail";
import StationList from "@/pages/stations/StationList";
import StationDetail from "@/pages/stations/StationDetail";
import AllianceIndex from "@/pages/alliance/AllianceIndex";
import AllianceTasks from "@/pages/alliance/AllianceTasks";
import AllianceSettlement from "@/pages/alliance/AllianceSettlement";
import DashboardIndex from "@/pages/dashboard/DashboardIndex";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/../shared/types";

const roleHomeMap: Record<UserRole, string> = {
  supplier: "/workspace/supplier",
  buyer: "/workspace/buyer",
  operator: "/workspace/operator",
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await useAuthStore.getState().checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">正在加载...</p>
        </div>
      </div>
    );
  }

  const userHome = user?.role ? roleHomeMap[user.role] : "/market";

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={userHome} replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={userHome} replace />} />

        <Route path="/" element={<Navigate to={isAuthenticated ? userHome : "/login"} replace />} />

        <Route path="/workspace/supplier" element={<SupplierWorkspace />} />
        <Route path="/workspace/buyer" element={<BuyerWorkspace />} />
        <Route path="/workspace/operator" element={<OperatorWorkspace />} />

        <Route path="/market" element={<MarketIndex />} />
        <Route path="/market/heatmap" element={<HeatmapPage />} />
        <Route path="/market/trend" element={<TrendPage />} />
        <Route path="/market/alert" element={<AlertPage />} />

        <Route path="/supplies" element={<SupplyList />} />
        <Route path="/supplies/:id" element={<SupplyDetail />} />

        <Route path="/stations" element={<StationList />} />
        <Route path="/stations/:id" element={<StationDetail />} />

        <Route path="/alliance" element={<AllianceIndex />} />
        <Route path="/alliance/tasks" element={<AllianceTasks />} />
        <Route path="/alliance/settlement" element={<AllianceSettlement />} />

        <Route path="/dashboard" element={<DashboardIndex />} />

        <Route path="*" element={<Navigate to={isAuthenticated ? userHome : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
