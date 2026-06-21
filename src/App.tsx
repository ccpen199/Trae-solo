import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import EmployerLayout from "@/components/layout/EmployerLayout";
import JobseekerLayout from "@/components/layout/JobseekerLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ContractLayout from "@/components/layout/ContractLayout";

import PlatformHomePage from "@/pages/home/PlatformHome";

import EmployerDashboard from "@/pages/employer/EmployerDashboard";
import EmployerVerification from "@/pages/employer/EmployerVerification";
import EmployerJobManagement from "@/pages/employer/EmployerJobManagement";
import EmployerJobCreate from "@/pages/employer/EmployerJobCreate";
import EmployerTalentPool from "@/pages/employer/EmployerTalentPool";
import EmployerInterview from "@/pages/employer/EmployerInterview";
import EmployerAnalytics from "@/pages/employer/EmployerAnalytics";

import JobseekerHome from "@/pages/jobseeker/JobseekerHome";
import JobseekerResume from "@/pages/jobseeker/JobseekerResume";
import JobseekerApplications from "@/pages/jobseeker/JobseekerApplications";
import JobseekerInterview from "@/pages/jobseeker/JobseekerInterview";
import JobseekerAuthorization from "@/pages/jobseeker/JobseekerAuthorization";

import AdminReviewDashboard from "@/pages/admin/AdminReviewDashboard";
import AdminCompanyReview from "@/pages/admin/AdminCompanyReview";
import AdminJobReview from "@/pages/admin/AdminJobReview";

import ContractTemplates from "@/pages/contract/ContractTemplates";
import ContractSigning from "@/pages/contract/ContractSigning";
import ContractRecords from "@/pages/contract/ContractRecords";
import ContractDispute from "@/pages/contract/ContractDispute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlatformHomePage />} />

        <Route path="/employer" element={<EmployerLayout />}>
          <Route path="dashboard" element={<EmployerDashboard />} />
          <Route path="verification" element={<EmployerVerification />} />
          <Route path="jobs" element={<EmployerJobManagement />} />
          <Route path="jobs/create" element={<EmployerJobCreate />} />
          <Route path="talent" element={<EmployerTalentPool />} />
          <Route path="interview" element={<EmployerInterview />} />
          <Route path="analytics" element={<EmployerAnalytics />} />
        </Route>

        <Route path="/jobseeker" element={<JobseekerLayout />}>
          <Route path="home" element={<JobseekerHome />} />
          <Route path="resume" element={<JobseekerResume />} />
          <Route path="applications" element={<JobseekerApplications />} />
          <Route path="interview" element={<JobseekerInterview />} />
          <Route path="authorization" element={<JobseekerAuthorization />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="review" element={<AdminReviewDashboard />} />
          <Route path="review/company" element={<AdminCompanyReview />} />
          <Route path="review/job" element={<AdminJobReview />} />
        </Route>

        <Route path="/contract" element={<ContractLayout />}>
          <Route path="templates" element={<ContractTemplates />} />
          <Route path="sign/:id" element={<ContractSigning />} />
          <Route path="records" element={<ContractRecords />} />
          <Route path="dispute" element={<ContractDispute />} />
        </Route>
      </Routes>
    </Router>
  );
}
