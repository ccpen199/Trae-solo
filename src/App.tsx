import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Certification from '@/pages/enterprise/Certification';
import JobList from '@/pages/enterprise/JobList';
import JobCreate from '@/pages/enterprise/JobCreate';
import JobDetail from '@/pages/enterprise/JobDetail';
import ResumeMatch from '@/pages/enterprise/ResumeMatch';
import InterviewSchedule from '@/pages/enterprise/InterviewSchedule';
import ApplicantHome from '@/pages/applicant/ApplicantHome';
import ApplicantEnterpriseDetail from '@/pages/applicant/ApplicantEnterpriseDetail';
import ApplicantApplications from '@/pages/applicant/ApplicantApplications';
import Blacklist from '@/pages/admin/Blacklist';
import FraudDetection from '@/pages/admin/FraudDetection';
import InterviewTracking from '@/pages/admin/InterviewTracking';
import Dashboard from '@/pages/admin/Dashboard';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const role = useAuthStore((s) => s.role);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const getDefaultRoute = () => {
    if (!isLoggedIn) return '/login';
    if (role === 'enterprise') return '/enterprise/jobs';
    if (role === 'applicant') return '/applicant/home';
    if (role === 'admin') return '/admin/dashboard';
    return '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        <Route
          path="/enterprise/certification"
          element={
            <Layout requiredRole="enterprise" pageTitle="企业认证" pageSubtitle="完成营业执照核验与法人实名绑定，解锁全部招聘功能">
              <Certification />
            </Layout>
          }
        />
        <Route
          path="/enterprise/jobs"
          element={
            <Layout requiredRole="enterprise" pageTitle="职位管理" pageSubtitle="发布、管理您的招聘职位">
              <JobList />
            </Layout>
          }
        />
        <Route
          path="/enterprise/jobs/create"
          element={
            <Layout requiredRole="enterprise" pageTitle="发布新职位" pageSubtitle="完善职位信息，吸引优质人才">
              <JobCreate />
            </Layout>
          }
        />
        <Route
          path="/enterprise/jobs/:id"
          element={
            <Layout requiredRole="enterprise" pageTitle="职位详情" pageSubtitle="查看职位信息与投递情况">
              <JobDetail />
            </Layout>
          }
        />
        <Route
          path="/enterprise/resumes"
          element={
            <Layout requiredRole="enterprise" pageTitle="简历智能匹配" pageSubtitle="NLP解析简历关键词，智能匹配度排序">
              <ResumeMatch />
            </Layout>
          }
        />
        <Route
          path="/enterprise/interviews"
          element={
            <Layout requiredRole="enterprise" pageTitle="面试邀约管理" pageSubtitle="一键邀约、日历占位、短信提醒">
              <InterviewSchedule />
            </Layout>
          }
        />

        <Route
          path="/applicant/home"
          element={
            <Layout requiredRole="applicant" pageTitle="推荐职位" pageSubtitle="为您精选的云南优质岗位">
              <ApplicantHome />
            </Layout>
          }
        />
        <Route
          path="/applicant/enterprise/:id"
          element={
            <Layout requiredRole="applicant" pageTitle="企业详情" pageSubtitle="了解企业信息与员工评价">
              <ApplicantEnterpriseDetail />
            </Layout>
          }
        />
        <Route
          path="/applicant/applications"
          element={
            <Layout requiredRole="applicant" pageTitle="投递记录" pageSubtitle="跟踪您的求职进展">
              <ApplicantApplications />
            </Layout>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <Layout requiredRole="admin" pageTitle="数据看板" pageSubtitle="招聘数据全局洞察">
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/admin/blacklist"
          element={
            <Layout requiredRole="admin" pageTitle="黑名单管理" pageSubtitle="防范黑中介与欺诈行为">
              <Blacklist />
            </Layout>
          }
        />
        <Route
          path="/admin/fraud-detection"
          element={
            <Layout requiredRole="admin" pageTitle="虚假职位识别" pageSubtitle="AI检测薪资异常与地址模糊，人工复核">
              <FraudDetection />
            </Layout>
          }
        />
        <Route
          path="/admin/interview-tracking"
          element={
            <Layout requiredRole="admin" pageTitle="面试反馈闭环" pageSubtitle="从初试到终面全环节跟踪与归因分析">
              <InterviewTracking />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
