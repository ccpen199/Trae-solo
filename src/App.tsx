import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SocialInsurance from "@/pages/SocialInsurance";
import Transfer from "@/pages/Transfer";
import Unemployment from "@/pages/Unemployment";
import Pension from "@/pages/Pension";
import Certification from "@/pages/Certification";
import Mediation from "@/pages/Mediation";
import Qualification from "@/pages/Qualification";
import EVoucher from "@/pages/EVoucher";
import Transit from "@/pages/Transit";
import Culture from "@/pages/Culture";
import Security from "@/pages/Security";
import DataBoard from "@/pages/DataBoard";
import AuditLog from "@/pages/AuditLog";
import Offline from "@/pages/Offline";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="social-insurance" element={<SocialInsurance />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="unemployment" element={<Unemployment />} />
            <Route path="pension" element={<Pension />} />
            <Route path="certification" element={<Certification />} />
            <Route path="mediation" element={<Mediation />} />
            <Route path="qualification" element={<Qualification />} />
            <Route path="e-voucher" element={<EVoucher />} />
            <Route path="transit" element={<Transit />} />
            <Route path="culture" element={<Culture />} />
            <Route path="security" element={<Security />} />
            <Route path="data-board" element={<DataBoard />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="offline" element={<Offline />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
