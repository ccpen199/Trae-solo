import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './contexts/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BorrowerLayout from './layouts/BorrowerLayout.jsx';
import ManagerLayout from './layouts/ManagerLayout.jsx';
import RiskLayout from './layouts/RiskLayout.jsx';
import ApprovalLayout from './layouts/ApprovalLayout.jsx';
import BorrowerDashboard from './pages/borrower/Dashboard.jsx';
import BorrowerApplication from './pages/borrower/Application.jsx';
import BorrowerApplicationDetail from './pages/borrower/ApplicationDetail.jsx';
import BorrowerLoans from './pages/borrower/Loans.jsx';
import ManagerDashboard from './pages/manager/Dashboard.jsx';
import ManagerTasks from './pages/manager/Tasks.jsx';
import ManagerApplicationDetail from './pages/manager/ApplicationDetail.jsx';
import RiskDashboard from './pages/risk/Dashboard.jsx';
import RiskReviews from './pages/risk/Reviews.jsx';
import RiskApplicationDetail from './pages/risk/ApplicationDetail.jsx';
import ApprovalDashboard from './pages/approval/Dashboard.jsx';
import ApprovalApprovals from './pages/approval/Approvals.jsx';
import ApprovalApplicationDetail from './pages/approval/ApplicationDetail.jsx';
import AuditLogs from './pages/AuditLogs.jsx';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading, getRoleHomePath } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return children;
};

const RedirectBasedOnRole = () => {
  const { user, getRoleHomePath } = useAuth();
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <RedirectBasedOnRole />
        </ProtectedRoute>
      } />
      
      <Route path="/borrower" element={
        <ProtectedRoute allowedRoles={['borrower']}>
          <BorrowerLayout />
        </ProtectedRoute>
      }>
        <Route index element={<BorrowerDashboard />} />
        <Route path="application" element={<BorrowerApplication />} />
        <Route path="application/:id" element={<BorrowerApplicationDetail />} />
        <Route path="loans" element={<BorrowerLoans />} />
      </Route>
      
      <Route path="/manager" element={
        <ProtectedRoute allowedRoles={['manager']}>
          <ManagerLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ManagerDashboard />} />
        <Route path="tasks" element={<ManagerTasks />} />
        <Route path="application/:id" element={<ManagerApplicationDetail />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
      
      <Route path="/risk" element={
        <ProtectedRoute allowedRoles={['risk_expert']}>
          <RiskLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RiskDashboard />} />
        <Route path="reviews" element={<RiskReviews />} />
        <Route path="application/:id" element={<RiskApplicationDetail />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
      
      <Route path="/approval" element={
        <ProtectedRoute allowedRoles={['approval_director']}>
          <ApprovalLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ApprovalDashboard />} />
        <Route path="approvals" element={<ApprovalApprovals />} />
        <Route path="application/:id" element={<ApprovalApplicationDetail />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
