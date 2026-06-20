import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import Dashboard from "@/pages/Dashboard";
import ContentManagement from "@/pages/ContentManagement";
import GISMap from "@/pages/GISMap";
import AppealManagement from "@/pages/AppealManagement";
import AuditManagement from "@/pages/AuditManagement";
import TieredPublishing from "@/pages/TieredPublishing";
import EmergencyManagement from "@/pages/EmergencyManagement";
import PublicOpinion from "@/pages/PublicOpinion";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/content" element={<ContentManagement />} />
          <Route path="/gis-map" element={<GISMap />} />
          <Route path="/appeal" element={<AppealManagement />} />
          <Route path="/audit" element={<AuditManagement />} />
          <Route path="/tiered" element={<TieredPublishing />} />
          <Route path="/emergency" element={<EmergencyManagement />} />
          <Route path="/public-opinion" element={<PublicOpinion />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/users" element={<Settings />} />
          <Route path="/settings/roles" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
