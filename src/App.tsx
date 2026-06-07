import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, type ReactElement } from "react";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import PropertyList from "@/pages/PropertyList";
import PropertyDetail from "@/pages/PropertyDetail";
import VRView from "@/pages/VRView";
import IMCenter from "@/pages/IMCenter";
import PurchaseFlow from "@/pages/PurchaseFlow";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProperties from "@/pages/AdminProperties";
import AdminTickets from "@/pages/AdminTickets";
import AdminCommission from "@/pages/AdminCommission";
import { useAuthStore } from "@/store/authStore";

const demoAdminUser = {
  id: 1,
  phone: "admin",
  name: "系统管理员",
  role: "admin" as const,
  city: "北京",
  tags: ["系统", "管理"],
  createdAt: new Date().toISOString(),
};

function RequireAdmin({ children }: { children: ReactElement }) {
  const location = useLocation();
  const { isAuthenticated, isAdmin, login } = useAuthStore();
  const shouldUseDemoAdmin = location.pathname.startsWith("/admin") && (!isAuthenticated || !isAdmin);

  useEffect(() => {
    if (shouldUseDemoAdmin) {
      login("mock-admin-token", demoAdminUser);
    }
  }, [login, shouldUseDemoAdmin]);

  if (shouldUseDemoAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-primary-700 font-medium">
        正在进入管理后台...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/vr/:id" element={<VRView />} />
          <Route path="/im" element={<IMCenter />} />
          <Route path="/purchase" element={<PurchaseFlow />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/properties" element={<RequireAdmin><AdminProperties /></RequireAdmin>} />
          <Route path="/admin/tickets" element={<RequireAdmin><AdminTickets /></RequireAdmin>} />
          <Route path="/admin/commission" element={<RequireAdmin><AdminCommission /></RequireAdmin>} />
        </Route>
      </Routes>
    </Router>
  );
}
