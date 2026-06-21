import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ScreeningPrediction from "@/pages/ScreeningPrediction";
import OccupancyHeatmap from "@/pages/OccupancyHeatmap";
import AudienceAnalysis from "@/pages/AudienceAnalysis";
import CrewCollaboration from "@/pages/CrewCollaboration";
import AdminHome, { AdminPermissions, AdminAudit, AdminReports } from "@/pages/AdminPanel";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/screening" element={<ScreeningPrediction />} />
          <Route path="/heatmap" element={<OccupancyHeatmap />} />
          <Route path="/audience" element={<AudienceAnalysis />} />
          <Route path="/crew" element={<CrewCollaboration />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/permissions" element={<AdminPermissions />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </Router>
  );
}

function NotFoundRedirect() {
  if (typeof window !== 'undefined') {
    setTimeout(() => { window.location.href = '/'; }, 1500);
  }
  return (
    <div className="min-h-screen bg-space-900 flex flex-col items-center justify-center text-center p-8">
      <div className="text-7xl font-serif font-bold text-gradient-gold mb-4">404</div>
      <p className="text-lg text-slate-300 mb-2">页面不存在</p>
      <p className="text-sm text-slate-500">即将跳转至数据大屏...</p>
    </div>
  );
}
