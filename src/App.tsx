import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import ApplyService from "@/pages/ApplyService";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import Certificates from "@/pages/Certificates";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import { useAppStore } from "@/store";

function Layout() {
  const user = useAppStore((s) => s.user);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginRoute = location.pathname === "/login";

  if (isLoginRoute) {
    return (
      <Routes>
      <Route path="/login" element={<Login />} />
    </Routes>
  );
  }

  if (isAdminRoute) {
    if (!user || user.userType !== "admin") {
      return <Navigate to="/login" />;
    }
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/apply/:serviceId" element={<ApplyService />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
