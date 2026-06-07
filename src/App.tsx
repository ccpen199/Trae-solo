import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import BillQuery from '@/pages/electricity/BillQuery';
import BillPayment from '@/pages/electricity/BillPayment';
import BillAnalysis from '@/pages/electricity/BillAnalysis';
import OutageNotice from '@/pages/electricity/OutageNotice';
import EfficiencyReport from '@/pages/energy/EfficiencyReport';
import PVPlan from '@/pages/energy/PVPlan';
import CarbonFootprint from '@/pages/energy/CarbonFootprint';
import SmartDevices from '@/pages/smartlife/SmartDevices';
import DeviceAlertDetail from '@/pages/smartlife/DeviceAlertDetail';
import EnergyTips from '@/pages/smartlife/EnergyTips';
import PointsMall from '@/pages/smartlife/PointsMall';
import PolicyLibrary from '@/pages/knowledge/PolicyLibrary';
import SafetyWiki from '@/pages/knowledge/SafetyWiki';
import ExpertSessions from '@/pages/knowledge/ExpertSessions';
import AuditRecords from '@/pages/compliance/AuditRecords';
import SubsidyManagement from '@/pages/compliance/SubsidyManagement';
import GreenRights from '@/pages/compliance/GreenRights';
import AdminDashboard from '@/pages/admin/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
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
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="electricity/bills" element={<BillQuery />} />
          <Route path="electricity/payment" element={<BillPayment />} />
          <Route path="electricity/analysis" element={<BillAnalysis />} />
          <Route path="electricity/outage" element={<OutageNotice />} />
          <Route path="energy/efficiency" element={<EfficiencyReport />} />
          <Route path="energy/pv" element={<PVPlan />} />
          <Route path="energy/carbon" element={<CarbonFootprint />} />
          <Route path="smartlife/devices" element={<SmartDevices />} />
          <Route path="smartlife/alerts/:id" element={<DeviceAlertDetail />} />
          <Route path="smartlife/tips" element={<EnergyTips />} />
          <Route path="smartlife/points" element={<PointsMall />} />
          <Route path="knowledge/policy" element={<PolicyLibrary />} />
          <Route path="knowledge/safety" element={<SafetyWiki />} />
          <Route path="knowledge/expert" element={<ExpertSessions />} />
          <Route path="compliance/audit" element={<AuditRecords />} />
          <Route path="compliance/subsidy" element={<SubsidyManagement />} />
          <Route path="compliance/green" element={<GreenRights />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
