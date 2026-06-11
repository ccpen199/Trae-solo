import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import SocialInsuranceIndex from "@/pages/social-insurance/Index";
import InsuranceDetail from "@/pages/social-insurance/Detail";
import Certificate from "@/pages/social-insurance/Certificate";
import EmploymentIndex from "@/pages/employment/Index";
import JobDetail from "@/pages/employment/JobDetail";
import Interview from "@/pages/employment/Interview";
import TalentIndex from "@/pages/talent/Index";
import Declare from "@/pages/talent/Declare";
import Progress from "@/pages/talent/Progress";
import Review from "@/pages/talent/Review";
import LaborIndex from "@/pages/labor/Index";
import Contract from "@/pages/labor/Contract";
import Report from "@/pages/labor/Report";
import Track from "@/pages/labor/Track";
import Dashboard from "@/pages/admin/Dashboard";
import Logs from "@/pages/admin/Logs";
import Policy from "@/pages/admin/Policy";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/social-insurance" element={<SocialInsuranceIndex />} />
          <Route path="/social-insurance/detail/:type" element={<InsuranceDetail />} />
          <Route path="/social-insurance/certificate" element={<Certificate />} />
          <Route path="/employment" element={<EmploymentIndex />} />
          <Route path="/employment/job/:id" element={<JobDetail />} />
          <Route path="/employment/interview/:id" element={<Interview />} />
          <Route path="/talent" element={<TalentIndex />} />
          <Route path="/talent/declare" element={<Declare />} />
          <Route path="/talent/progress/:id" element={<Progress />} />
          <Route path="/talent/review/:id" element={<Review />} />
          <Route path="/labor" element={<LaborIndex />} />
          <Route path="/labor/contract" element={<Contract />} />
          <Route path="/labor/report" element={<Report />} />
          <Route path="/labor/track/:id" element={<Track />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/logs" element={<Logs />} />
          <Route path="/admin/policy" element={<Policy />} />
        </Route>
      </Routes>
    </Router>
  );
}
