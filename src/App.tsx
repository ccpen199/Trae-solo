import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import CameraRecognition from "@/pages/CameraRecognition";
import VoiceQuery from "@/pages/VoiceQuery";
import Search from "@/pages/Search";
import Feedback from "@/pages/Feedback";
import AdminLogin from "@/pages/admin/Login";
import StandardManagement from "@/pages/admin/StandardManagement";
import PdfManagement from "@/pages/admin/PdfManagement";
import Statistics from "@/pages/dashboard/Statistics";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<CameraRecognition />} />
          <Route path="/voice" element={<VoiceQuery />} />
          <Route path="/search" element={<Search />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>
        
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route element={<AdminLayout />}>
          <Route path="/admin/standards" element={<StandardManagement />} />
          <Route path="/admin/pdf" element={<PdfManagement />} />
          <Route path="/dashboard" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}
