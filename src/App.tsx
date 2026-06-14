import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SocialSecurityPage from "@/pages/SocialSecurityPage";
import PoliciesPage from "@/pages/PoliciesPage";
import PolicyDetailPage from "@/pages/PolicyDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import TrafficPage from "@/pages/TrafficPage";
import PaymentPage from "@/pages/PaymentPage";
import CommunityPage from "@/pages/CommunityPage";
import PoiPage from "@/pages/PoiPage";
import AdminPage from "@/pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/social-security" element={<SocialSecurityPage />} />
      <Route path="/service/social-security" element={<SocialSecurityPage />} />
      <Route path="/service/housing-fund" element={<SocialSecurityPage />} />
      <Route path="/traffic" element={<TrafficPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/poi" element={<PoiPage />} />
      <Route path="/policies" element={<PoliciesPage />} />
      <Route path="/policies/:id" element={<PolicyDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin/dashboard" element={<AdminPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
