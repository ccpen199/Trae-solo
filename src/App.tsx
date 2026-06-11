import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import LawyerDesk from "@/pages/LawyerDesk/Desk";
import GrabPool from "@/pages/LawyerDesk/GrabPool";
import LawyerCases from "@/pages/LawyerDesk/Cases";
import QualificationCenter from "@/pages/Qualification/Center";
import ConsultationList from "@/pages/Consultation/List";
import ConsultationSubmit from "@/pages/Consultation/Submit";
import ConsultationDetail from "@/pages/Consultation/Detail";
import ConsultationSummary from "@/pages/Consultation/Summary";
import Evaluate from "@/pages/Dispute/Evaluate";
import Appeal from "@/pages/Dispute/Appeal";
import Arbitrate from "@/pages/Dispute/Arbitrate";
import Dashboard from "@/pages/Admin/Dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route element={<MainLayout />}>
          <Route path="/consultations" element={<ConsultationList />} />
          <Route path="/consultation/submit" element={<ConsultationSubmit />} />
          <Route path="/order/submit" element={<ConsultationSubmit />} />
          <Route path="/consultation/:id" element={<ConsultationDetail />} />
          <Route path="/consultation/:id/summary" element={<ConsultationSummary />} />

          <Route path="/lawyer/workspace" element={<LawyerDesk />} />
          <Route path="/lawyer/grab" element={<GrabPool />} />
          <Route path="/lawyer/cases" element={<LawyerCases />} />
          <Route path="/lawyer/qualification" element={<QualificationCenter />} />

          <Route path="/dispute/evaluate/:id" element={<Evaluate />} />
          <Route path="/dispute/appeal/:id" element={<Appeal />} />
          <Route path="/dispute/arbitrate" element={<Arbitrate />} />

          <Route path="/admin/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-graphite-50">
            <div className="text-center">
              <h1 className="font-serif text-6xl font-bold text-justice-500 mb-4">404</h1>
              <p className="text-graphite-400 mb-8">页面不存在或已被移除</p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
