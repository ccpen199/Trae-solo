import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Pos from "@/pages/Pos";
import Orders from "@/pages/Orders";
import Refunds from "@/pages/Refunds";
import Shifts from "@/pages/Shifts";
import Reconciliation from "@/pages/Reconciliation";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import { useAuthStore } from "@/store/auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const checkAuth = useAuthStore(state => state.checkAuth);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsAuth(false);
        setLoading(false);
        return;
      }
      try {
        await checkAuth();
        setIsAuth(true);
      } catch {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="pos" element={<Pos />} />
          <Route path="orders" element={<Orders />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="shifts" element={<Shifts />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="admin/users" element={<Admin tab="users" />} />
          <Route path="admin/roles" element={<Admin tab="roles" />} />
          <Route path="admin/stores" element={<Admin tab="stores" />} />
          <Route path="admin/products" element={<Admin tab="products" />} />
          <Route path="admin/members" element={<Admin tab="members" />} />
          <Route path="admin/audit" element={<Admin tab="audit" />} />
          <Route path="admin/review" element={<Admin tab="review" />} />
          <Route path="admin/profile" element={<Admin tab="profile" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
