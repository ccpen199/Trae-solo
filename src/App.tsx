import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import VoiceSearchModal from "@/components/VoiceSearchModal";
import Home from "@/pages/Home";
import PostList from "@/pages/PostList";
import PostDetail from "@/pages/PostDetail";
import Publish from "@/pages/Publish";
import VoiceSearch from "@/pages/VoiceSearch";
import MerchantCenter from "@/pages/MerchantCenter";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminRisk from "@/pages/admin/Risk";
import AdminTraffic from "@/pages/admin/Traffic";
import AdminAudit from "@/pages/admin/Audit";
import AdminGeo from "@/pages/admin/Geo";
import AdminApi from "@/pages/admin/Api";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <VoiceSearchModal />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/list" element={<PostList />} />
          <Route path="/list/:id" element={<PostDetail />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/publish/:category" element={<Publish />} />
          <Route path="/voice-search" element={<VoiceSearch />} />
          <Route path="/merchant" element={<MerchantCenter />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="risk" element={<AdminRisk />} />
            <Route path="traffic" element={<AdminTraffic />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="geo" element={<AdminGeo />} />
            <Route path="api" element={<AdminApi />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
