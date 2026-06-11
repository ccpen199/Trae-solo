import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Guide from "@/pages/Guide";
import GuideOCR from "@/pages/GuideOCR";
import GuideTrack from "@/pages/GuideTrack";
import Monitor from "@/pages/admin/Monitor";
import Heatmap from "@/pages/admin/Heatmap";
import Material from "@/pages/admin/Material";
import Integration from "@/pages/admin/Integration";
import Relay from "@/pages/admin/Relay";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/guide/ocr" element={<GuideOCR />} />
          <Route path="/guide/track" element={<GuideTrack />} />
          <Route path="/admin/monitor" element={<Monitor />} />
          <Route path="/admin/heatmap" element={<Heatmap />} />
          <Route path="/admin/material" element={<Material />} />
          <Route path="/admin/integration" element={<Integration />} />
          <Route path="/admin/relay" element={<Relay />} />
        </Route>
      </Routes>
    </Router>
  );
}
