import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SocialSecurityIndex from "@/pages/social-security/Index";
import Query from "@/pages/social-security/Query";
import Payment from "@/pages/social-security/Payment";
import EmploymentIndex from "@/pages/employment/Index";
import Unemployment from "@/pages/employment/Unemployment";
import TalentIndex from "@/pages/talent/Index";
import Title from "@/pages/talent/Title";
import LaborIndex from "@/pages/labor/Index";
import Contract from "@/pages/labor/Contract";
import Complaint from "@/pages/labor/Complaint";
import Policy from "@/pages/Policy";
import PolicyMaterial from "@/pages/PolicyMaterial";
import MonitorIndex from "@/pages/monitor/Index";
import Dashboard from "@/pages/monitor/Dashboard";
import Timeout from "@/pages/monitor/Timeout";
import Rejection from "@/pages/monitor/Rejection";
import Hotspot from "@/pages/monitor/Hotspot";
import Profile from "@/pages/Profile";
import ProfileRecords from "@/pages/ProfileRecords";
import ProfileSync from "@/pages/ProfileSync";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/social-security" element={<SocialSecurityIndex />} />
          <Route path="/social-security/query" element={<Query />} />
          <Route path="/social-security/payment" element={<Payment />} />
          <Route path="/employment" element={<EmploymentIndex />} />
          <Route path="/employment/unemployment" element={<Unemployment />} />
          <Route path="/talent" element={<TalentIndex />} />
          <Route path="/talent/title" element={<Title />} />
          <Route path="/labor" element={<LaborIndex />} />
          <Route path="/labor/contract" element={<Contract />} />
          <Route path="/labor/complaint" element={<Complaint />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/policy/material" element={<PolicyMaterial />} />
          <Route path="/monitor" element={<MonitorIndex />} />
          <Route path="/monitor/dashboard" element={<Dashboard />} />
          <Route path="/monitor/timeout" element={<Timeout />} />
          <Route path="/monitor/rejection" element={<Rejection />} />
          <Route path="/monitor/hotspot" element={<Hotspot />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/records" element={<ProfileRecords />} />
          <Route path="/profile/sync" element={<ProfileSync />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}
