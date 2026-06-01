import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import BatteryList from "@/pages/BatteryList";
import BatteryDetail from "@/pages/BatteryDetail";
import BatteryForm from "@/pages/BatteryForm";
import UsageRecordList from "@/pages/UsageRecordList";
import UsageRecordForm from "@/pages/UsageRecordForm";
import MaintenancePlanList from "@/pages/MaintenancePlanList";
import MaintenancePlanDetail from "@/pages/MaintenancePlanDetail";
import SafetyAlertList from "@/pages/SafetyAlertList";
import SafetyAlertDetail from "@/pages/SafetyAlertDetail";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/batteries" element={<BatteryList />} />
          <Route path="/batteries/new" element={<BatteryForm />} />
          <Route path="/batteries/:id" element={<BatteryDetail />} />
          <Route path="/batteries/:id/edit" element={<BatteryForm />} />
          <Route path="/usage" element={<UsageRecordList />} />
          <Route path="/usage/new" element={<UsageRecordForm />} />
          <Route path="/maintenance" element={<MaintenancePlanList />} />
          <Route path="/maintenance/:id" element={<MaintenancePlanDetail />} />
          <Route path="/alerts" element={<SafetyAlertList />} />
          <Route path="/alerts/:id" element={<SafetyAlertDetail />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}
