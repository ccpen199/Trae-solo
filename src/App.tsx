import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import PropertyList from "@/pages/PropertyList";
import PropertyDetail from "@/pages/PropertyDetail";
import AgentWorkspace from "@/pages/AgentWorkspace";
import AgentDetail from "@/pages/AgentDetail";
import BuyerCenter from "@/pages/BuyerCenter";
import MortgageCalculator from "@/pages/MortgageCalculator";
import TaxCalculator from "@/pages/TaxCalculator";
import VRAnalytics from "@/pages/VRAnalytics";
import DispatchCenter from "@/pages/DispatchCenter";
import AdminPanel from "@/pages/AdminPanel";
import OrgManagement from "@/pages/OrgManagement";
import PerformanceDashboard from "@/pages/PerformanceDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/agents" element={<AgentWorkspace />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/buyers" element={<BuyerCenter />} />
          <Route path="/buyers/mortgage" element={<MortgageCalculator />} />
          <Route path="/buyers/tax" element={<TaxCalculator />} />
          <Route path="/vr-analytics" element={<VRAnalytics />} />
          <Route path="/dispatch" element={<DispatchCenter />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/org" element={<OrgManagement />} />
          <Route path="/admin/performance" element={<PerformanceDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
