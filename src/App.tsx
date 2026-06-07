import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Verify from "@/pages/Verify";
import HealthService from "@/pages/HealthService";
import Transport from "@/pages/Transport";
import Tourism from "@/pages/Tourism";
import SocialSecurity from "@/pages/SocialSecurity";
import Police from "@/pages/Police";
import Subscriptions from "@/pages/Subscriptions";
import Applications from "@/pages/Applications";
import Complaints from "@/pages/Complaints";
import Profile from "@/pages/Profile";
import AdminServices from "@/pages/admin/Services";
import AdminMonitor from "@/pages/admin/Monitor";
import AdminTickets from "@/pages/admin/Tickets";
import AdminKnowledge from "@/pages/admin/Knowledge";
import AdminUsers from "@/pages/admin/Users";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
          <Route path="/health" element={<HealthService />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/tourism" element={<Tourism />} />
          <Route path="/social-security" element={<ProtectedRoute><SocialSecurity /></ProtectedRoute>} />
          <Route path="/police" element={<Police />} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Route>
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminServices />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="monitor" element={<AdminMonitor />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="knowledge" element={<AdminKnowledge />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}
