import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/home/HomePage";
import PersonalPage from "@/pages/personal/PersonalPage";
import SocialInsurancePage from "@/pages/personal/SocialInsurancePage";
import MedicalPage from "@/pages/personal/MedicalPage";
import ExamPage from "@/pages/personal/ExamPage";
import EsscPage from "@/pages/personal/EsscPage";
import EnterprisePage from "@/pages/enterprise/EnterprisePage";
import InsuranceDeclarationPage from "@/pages/enterprise/InsuranceDeclarationPage";
import UnemploymentPage from "@/pages/enterprise/UnemploymentPage";
import EContractPage from "@/pages/enterprise/EContractPage";
import AdminPage from "@/pages/admin/AdminPage";
import TimeoutWarningPage from "@/pages/admin/TimeoutWarningPage";
import PolicyTagsPage from "@/pages/admin/PolicyTagsPage";
import IdentityAuditPage from "@/pages/admin/IdentityAuditPage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/personal" element={<PersonalPage />} />
          <Route path="/personal/social-insurance" element={<SocialInsurancePage />} />
          <Route path="/personal/medical" element={<MedicalPage />} />
          <Route path="/personal/exam" element={<ExamPage />} />
          <Route path="/personal/essc" element={<EsscPage />} />
          <Route path="/enterprise" element={<EnterprisePage />} />
          <Route path="/enterprise/insurance-declaration" element={<InsuranceDeclarationPage />} />
          <Route path="/enterprise/unemployment" element={<UnemploymentPage />} />
          <Route path="/enterprise/e-contract" element={<EContractPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/timeout-warning" element={<TimeoutWarningPage />} />
          <Route path="/admin/policy-tags" element={<PolicyTagsPage />} />
          <Route path="/admin/identity-audit" element={<IdentityAuditPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
