import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/stores";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/dashboard";
import MotionList from "@/pages/council/MotionList";
import MotionDetail from "@/pages/council/MotionDetail";
import NewMotion from "@/pages/council/NewMotion";
import ProfilePage from "@/pages/profile/ProfilePage";
import SettingsPage from "@/pages/settings/SettingsPage";
import VoucherTrace from "@/pages/finance/VoucherTrace";
import { Layout } from "@/components/layout";
import {
  AdminCouncilPage,
  AdminOwnersPage,
  AdminPropertyPage,
  AdminStreetPage,
  AuditReportPage,
  CrowdfundingPage,
  EconomyHomePage,
  ExchangePage,
  FinanceOverviewPage,
  InvoicePage,
  MotionOverviewPage,
  NewSealApplicationPage,
  PropertyTicketsPage,
  PropertyTicketDetailPage,
  SealApplicationsPage,
  SealCabinetPage,
  SupervisionPage,
  SwapPage,
} from "@/pages/Modules";

function RootRedirect() {
  const { isLoggedIn } = useAppStore();
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAppStore();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/council" element={<MotionOverviewPage />} />
          <Route path="/council/motions" element={<MotionList />} />
          <Route path="/council/motions/new" element={<NewMotion />} />
          <Route path="/council/new" element={<NewMotion />} />
          <Route path="/council/:id" element={<MotionDetail />} />
          <Route path="/finance" element={<FinanceOverviewPage />} />
          <Route path="/finance/overview" element={<FinanceOverviewPage />} />
          <Route path="/finance/invoices" element={<InvoicePage />} />
          <Route path="/finance/audit" element={<AuditReportPage />} />
          <Route path="/finance/voucher-trace" element={<VoucherTrace />} />
          <Route path="/seal" element={<SealApplicationsPage />} />
          <Route path="/seal/applications" element={<SealApplicationsPage />} />
          <Route path="/seal/applications/new" element={<NewSealApplicationPage />} />
          <Route path="/seal/cabinet" element={<SealCabinetPage />} />
          <Route path="/property" element={<PropertyTicketsPage />} />
          <Route path="/property/tickets" element={<PropertyTicketsPage />} />
          <Route path="/property/tickets/:id" element={<PropertyTicketDetailPage />} />
          <Route path="/property/supervision" element={<SupervisionPage />} />
          <Route path="/economy" element={<EconomyHomePage />} />
          <Route path="/economy/home" element={<EconomyHomePage />} />
          <Route path="/economy/swap" element={<SwapPage />} />
          <Route path="/economy/crowdfunding" element={<CrowdfundingPage />} />
          <Route path="/economy/exchange" element={<ExchangePage />} />
          <Route path="/admin" element={<AdminOwnersPage />} />
          <Route path="/admin/owners" element={<AdminOwnersPage />} />
          <Route path="/admin/council" element={<AdminCouncilPage />} />
          <Route path="/admin/property" element={<AdminPropertyPage />} />
          <Route path="/admin/street" element={<AdminStreetPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/home" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}
