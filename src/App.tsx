import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import Home from "@/pages/Home";
import Track from "@/pages/Track";
import Order from "@/pages/Order";
import Coverage from "@/pages/Coverage";
import Estimate from "@/pages/Estimate";
import Profile from "@/pages/Profile";
import AdminAlerts from "@/pages/admin/Alerts";
import AdminNetworks from "@/pages/admin/Networks";
import AdminKnowledge from "@/pages/admin/Knowledge";
import AdminProfiling from "@/pages/admin/Profiling";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/track" element={<Track />} />
          <Route path="/order" element={<Order />} />
          <Route path="/coverage" element={<Coverage />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="networks" element={<AdminNetworks />} />
          <Route path="knowledge" element={<AdminKnowledge />} />
          <Route path="profiling" element={<AdminProfiling />} />
        </Route>
      </Routes>
    </Router>
  );
}
