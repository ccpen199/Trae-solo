import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import TaskList from '../pages/tasks/TaskList';
import TaskPublish from '../pages/tasks/TaskPublish';
import TaskDetail from '../pages/tasks/TaskDetail';
import TalentList from '../pages/talents/TalentList';
import TalentDetail from '../pages/talents/TalentDetail';
import MessageCenter from '../pages/messages/MessageCenter';
import FinanceCenter from '../pages/finance/FinanceCenter';
import AdminTaskBoard from '../pages/admin/AdminTaskBoard';
import AdminTalents from '../pages/admin/AdminTalents';
import AdminDisputes from '../pages/admin/AdminDisputes';
import AdminAudit from '../pages/admin/AdminAudit';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsChecking(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tasks', element: <TaskList /> },
      { path: 'tasks/publish', element: <TaskPublish /> },
      { path: 'tasks/:id', element: <TaskDetail /> },
      { path: 'talents', element: <TalentList /> },
      { path: 'talents/:id', element: <TalentDetail /> },
      { path: 'messages', element: <MessageCenter /> },
      { path: 'finance', element: <FinanceCenter /> },
      {
        path: 'admin/tasks',
        element: (
          <ProtectedRoute roles={['admin']}>
            <AdminTaskBoard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/talents',
        element: (
          <ProtectedRoute roles={['admin']}>
            <AdminTalents />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/disputes',
        element: (
          <ProtectedRoute roles={['admin']}>
            <AdminDisputes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit',
        element: (
          <ProtectedRoute roles={['admin']}>
            <AdminAudit />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
