import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import { ProtectedRoute } from "@/components/layout";
import DashboardHome from "@/pages/enterprise/DashboardHome";
import JdCreator from "@/pages/enterprise/JdCreator";
import CandidatePool from "@/pages/enterprise/CandidatePool";
import IMClient from "@/pages/enterprise/IMClient";
import AnalyticsBoard from "@/pages/enterprise/AnalyticsBoard";
import JobFeed from "@/pages/talent/JobFeed";
import JobDetail from "@/pages/talent/JobDetail";
import TalentProfile from "@/pages/talent/TalentProfile";
import AdminCompanyReview from "@/pages/admin/AdminCompanyReview";
import AdminRiskControl from "@/pages/admin/AdminRiskControl";
import AdminHeatmap from "@/pages/admin/AdminHeatmap";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['hr', 'admin', 'store_manager']}>
            <DashboardHome />
          </ProtectedRoute>
        } />
        <Route path="/jd/create" element={
          <ProtectedRoute allowedRoles={['hr', 'admin', 'store_manager']}>
            <JdCreator />
          </ProtectedRoute>
        } />
        <Route path="/candidates" element={
          <ProtectedRoute allowedRoles={['hr', 'admin', 'store_manager']}>
            <CandidatePool />
          </ProtectedRoute>
        } />
        <Route path="/im" element={
          <ProtectedRoute allowedRoles={['hr', 'talent', 'admin', 'store_manager']}>
            <IMClient />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['hr', 'admin', 'store_manager']}>
            <AnalyticsBoard />
          </ProtectedRoute>
        } />
        
        <Route path="/jobs" element={
          <ProtectedRoute allowedRoles={['talent', 'hr', 'admin']}>
            <JobFeed />
          </ProtectedRoute>
        } />
        <Route path="/job/:jobId" element={
          <ProtectedRoute allowedRoles={['talent', 'hr', 'admin']}>
            <JobDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['talent', 'hr', 'admin']}>
            <TalentProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/companies" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCompanyReview />
          </ProtectedRoute>
        } />
        <Route path="/admin/risk" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRiskControl />
          </ProtectedRoute>
        } />
        <Route path="/admin/heatmap" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminHeatmap />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="text-center">
              <h1 className="text-6xl font-serif font-bold text-primary-500 mb-4">404</h1>
              <p className="text-xl text-neutral-600 mb-8">页面未找到</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
