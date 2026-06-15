import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import {
  JSHome,
  JSJobList,
  JSJobDetail,
  JSResume,
  JSTownship,
  JSCampus,
  JSEducation,
  JSApplications,
  JSProfile,
  ENDashboard,
  ENJobManage,
  ENInbox,
  ENInterview,
  ENRpo,
  ENAnalytics,
  ENSubsidy,
  ENSettings,
  AMSummary,
  AMEnterpriseAudit,
  AMTownship,
  AMSkillMap,
  AMSubsidyAudit,
  AMSystemSettings,
  Placeholder,
} from '@/pages/_imports';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/jobseeker/home" replace />} />

        <Route path="/jobseeker" element={<Navigate to="/jobseeker/home" replace />} />
        <Route path="/jobseeker/home" element={<JSHome />} />
        <Route path="/jobseeker/jobs" element={<JSJobList />} />
        <Route path="/jobseeker/jobs/:id" element={<JSJobDetail />} />
        <Route path="/jobseeker/resume" element={<JSResume />} />
        <Route path="/jobseeker/township" element={<JSTownship />} />
        <Route path="/jobseeker/campus" element={<JSCampus />} />
        <Route path="/jobseeker/education" element={<JSEducation />} />
        <Route path="/jobseeker/applications" element={<JSApplications />} />
        <Route path="/jobseeker/profile" element={<JSProfile />} />
        <Route path="/jobseeker/*" element={<Placeholder title="求职者端页面" />} />

        <Route path="/enterprise" element={<Navigate to="/enterprise/dashboard" replace />} />
        <Route path="/enterprise/dashboard" element={<ENDashboard />} />
        <Route path="/enterprise/jobs" element={<ENJobManage />} />
        <Route path="/enterprise/inbox" element={<ENInbox />} />
        <Route path="/enterprise/interview" element={<ENInterview />} />
        <Route path="/enterprise/rpo" element={<ENRpo />} />
        <Route path="/enterprise/analytics" element={<ENAnalytics />} />
        <Route path="/enterprise/subsidy" element={<ENSubsidy />} />
        <Route path="/enterprise/settings" element={<ENSettings />} />
        <Route path="/enterprise/*" element={<Placeholder title="企业端页面" />} />

        <Route path="/admin" element={<Navigate to="/admin/summary" replace />} />
        <Route path="/admin/summary" element={<AMSummary />} />
        <Route path="/admin/enterprise-audit" element={<AMEnterpriseAudit />} />
        <Route path="/admin/township" element={<AMTownship />} />
        <Route path="/admin/skill-map" element={<AMSkillMap />} />
        <Route path="/admin/subsidy-audit" element={<AMSubsidyAudit />} />
        <Route path="/admin/system" element={<AMSystemSettings />} />
        <Route path="/admin/*" element={<Placeholder title="管理后台页面" />} />

        <Route path="*" element={<Placeholder title="404 页面不存在" description="您访问的页面不存在，请检查地址或返回首页" />} />
      </Route>
    </Routes>
  );
}
