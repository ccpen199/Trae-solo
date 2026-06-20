import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Spots from "@/pages/Spots";
import SpotDetail from "@/pages/SpotDetail";
import AIAnalysis from "@/pages/AIAnalysis";
import Profile from "@/pages/Profile";
import Social from "@/pages/Social";
import AdminOverview from "@/pages/admin/Overview";
import AdminDataSources from "@/pages/admin/DataSources";
import AdminModels from "@/pages/admin/Models";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="spots" element={<Spots />} />
          <Route path="spots/:id" element={<SpotDetail />} />
          <Route path="ai-analysis" element={<AIAnalysis />} />
          <Route path="profile" element={<Profile />} />
          <Route path="social" element={<Social />} />
          <Route path="admin" element={<AdminOverview />} />
          <Route path="admin/data-sources" element={<AdminDataSources />} />
          <Route path="admin/models" element={<AdminModels />} />
        </Route>
      </Routes>
    </Router>
  );
}
