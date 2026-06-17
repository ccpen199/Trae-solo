import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Translate from "@/pages/Translate";
import Album from "@/pages/Album";
import Community from "@/pages/Community";
import CommunityPostDetail from "@/pages/CommunityPostDetail";
import SymptomCheck from "@/pages/SymptomCheck";
import Pets from "@/pages/Pets";
import PetDetail from "@/pages/PetDetail";
import Training from "@/pages/Training";
import AdminVoiceprint from "@/pages/admin/AdminVoiceprint";
import AdminContentSafety from "@/pages/admin/AdminContentSafety";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/translate" element={<Translate />} />
            <Route path="/album" element={<Album />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/symptom-check" element={<SymptomCheck />} />
            <Route path="/community/:id" element={<CommunityPostDetail />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/pets/:id" element={<PetDetail />} />
            <Route path="/training" element={<Training />} />
            <Route path="/admin/voiceprint" element={<AdminVoiceprint />} />
            <Route path="/admin/content-safety" element={<AdminContentSafety />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
