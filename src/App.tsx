import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useStore } from "@/store";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import Organization from "@/pages/Organization";
import Benefits from "@/pages/Benefits";
import Payment from "@/pages/Payment";
import Travel from "@/pages/Travel";
import Life from "@/pages/Life";
import AdminOverview from "@/pages/AdminOverview";
import SupplierManagement from "@/pages/SupplierManagement";
import ApprovalWorkflow from "@/pages/ApprovalWorkflow";
import DataAnalytics from "@/pages/DataAnalytics";
import RecommendConfig from "@/pages/RecommendConfig";

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useStore((s) => s.user);
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireGuest({ children }: { children: JSX.Element }) {
  const user = useStore((s) => s.user);
  const token = localStorage.getItem("token");
  if (user || token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/benefits" element={<Benefits />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/life" element={<Life />} />
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/suppliers" element={<SupplierManagement />} />
          <Route path="/admin/approval" element={<ApprovalWorkflow />} />
          <Route path="/admin/analytics" element={<DataAnalytics />} />
          <Route path="/admin/recommend" element={<RecommendConfig />} />
        </Route>
      </Routes>
    </Router>
  );
}
