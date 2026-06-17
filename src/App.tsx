import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Dashboard from "@/pages/dashboard";
import MotionList from "@/pages/council/MotionList";
import MotionDetail from "@/pages/council/MotionDetail";
import NewMotion from "@/pages/council/NewMotion";
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<Layout />}>
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
        </Route>
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
