import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { UserRole } from '@/types';
import GuestLayout from '@/components/Layout/GuestLayout';
import HallLayout from '@/components/Layout/HallLayout';
import PlatformLayout from '@/components/Layout/PlatformLayout';
import OpsLayout from '@/components/Layout/OpsLayout';
import AdminLayout from '@/components/Layout/AdminLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Page403 from '@/pages/NotFound/403';
import Page404 from '@/pages/NotFound/404';
import HallIndex from '@/pages/Hall/Index';
import SceneService from '@/pages/Hall/Scene';
import CitizenFeedback from '@/pages/Hall/Feedback';
import MyServices from '@/pages/Hall/MyServices';
import PlatformDashboard from '@/pages/Platform/Dashboard';
import PlatformTaskList from '@/pages/Platform/TaskList';
import PlatformTaskPublish from '@/pages/Platform/TaskPublish';
import PlatformTaskDetail from '@/pages/Platform/TaskDetail';
import PlatformTalentPool from '@/pages/Platform/TalentPool';
import PlatformTalentDetail from '@/pages/Platform/TalentDetail';
import PlatformDisputes from '@/pages/Platform/Disputes';
import PlatformFinance from '@/pages/Platform/Finance';
import PlatformSettings from '@/pages/Platform/Settings';
import OpsDashboard from '@/pages/Ops/Dashboard';
import OpsTaskList from '@/pages/Ops/TaskList';
import OpsSubmission from '@/pages/Ops/Submission';
import OpsPortfolio from '@/pages/Ops/Portfolio';
import OpsDisputes from '@/pages/Ops/Disputes';
import OpsFinance from '@/pages/Ops/Finance';
import OpsSettings from '@/pages/Ops/Settings';
import AdminDashboard from '@/pages/Admin/Dashboard';
import AdminTaskManagement from '@/pages/Admin/TaskManagement';
import AdminTaskBoard from '@/pages/Admin/TaskBoard';
import AdminTaskReview from '@/pages/Admin/TaskReview';
import AdminProviderManagement from '@/pages/Admin/ProviderManagement';
import AdminIPManagement from '@/pages/Admin/IPManagement';
import AdminDisputeArbitration from '@/pages/Admin/DisputeArbitration';
import AdminAuditLog from '@/pages/Admin/AuditLog';
import AdminFinance from '@/pages/Admin/Finance';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { isLoggedIn, userInfo } = useUserStore();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && userInfo && !allowedRoles.includes((userInfo.role || userInfo.userType) as UserRole)) {
    return <Navigate to="/403" replace />;
  }
  
  return <>{children}</>;
};

const RedirectByRole: React.FC = () => {
  const { userInfo, isLoggedIn } = useUserStore();
  
  if (!isLoggedIn) {
    return <Navigate to="/hall" replace />;
  }
  
  switch (userInfo?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'platform':
      return <Navigate to="/platform/dashboard" replace />;
    case 'ops':
      return <Navigate to="/ops/dashboard" replace />;
    default:
      return <Navigate to="/hall" replace />;
  }
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RedirectByRole />
  },
  {
    path: '/login',
    element: (
      <GuestLayout>
        <Login />
      </GuestLayout>
    )
  },
  {
    path: '/register',
    element: (
      <GuestLayout>
        <Register />
      </GuestLayout>
    )
  },
  {
    path: '/403',
    element: <Page403 />
  },
  {
    path: '/404',
    element: <Page404 />
  },
  {
    path: '/hall',
    element: <HallLayout />,
    children: [
      { index: true, element: <HallIndex /> },
      { path: 'scene', element: <SceneService /> },
      { path: 'scene/:id', element: <SceneService /> },
      { path: 'feedback', element: <CitizenFeedback /> },
      { path: 'my', element: <MyServices /> }
    ]
  },
  {
    path: '/platform',
    element: (
      <ProtectedRoute allowedRoles={['platform']}>
        <PlatformLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <PlatformDashboard /> },
      { path: 'tasks', element: <PlatformTaskList /> },
      { path: 'tasks/publish', element: <PlatformTaskPublish /> },
      { path: 'tasks/:id', element: <PlatformTaskDetail /> },
      { path: 'talent', element: <PlatformTalentPool /> },
      { path: 'talent/:id', element: <PlatformTalentDetail /> },
      { path: 'disputes', element: <PlatformDisputes /> },
      { path: 'finance', element: <PlatformFinance /> },
      { path: 'settings', element: <PlatformSettings /> }
    ]
  },
  {
    path: '/ops',
    element: (
      <ProtectedRoute allowedRoles={['ops']}>
        <OpsLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <OpsDashboard /> },
      { path: 'tasks', element: <OpsTaskList /> },
      { path: 'submissions', element: <OpsSubmission /> },
      { path: 'portfolio', element: <OpsPortfolio /> },
      { path: 'disputes', element: <OpsDisputes /> },
      { path: 'finance', element: <OpsFinance /> },
      { path: 'settings', element: <OpsSettings /> }
    ]
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'tasks', element: <AdminTaskManagement /> },
      { path: 'tasks/board', element: <AdminTaskBoard /> },
      { path: 'tasks/review', element: <AdminTaskReview /> },
      { path: 'providers', element: <AdminProviderManagement /> },
      { path: 'ip', element: <AdminIPManagement /> },
      { path: 'disputes', element: <AdminDisputeArbitration /> },
      { path: 'audit', element: <AdminAuditLog /> },
      { path: 'finance', element: <AdminFinance /> }
    ]
  },
  {
    path: '*',
    element: <Page404 />
  }
]);

export default router;
