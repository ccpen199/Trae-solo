import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Declaration from "@/pages/Declaration";
import Verify from "@/pages/Verify";
import Appeal from "@/pages/Appeal";
import FAQ from "@/pages/FAQ";
import OfficerLogin from "@/pages/OfficerLogin";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/declaration" element={<Declaration />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/appeal" element={<Appeal />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/officer-login" element={<OfficerLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
