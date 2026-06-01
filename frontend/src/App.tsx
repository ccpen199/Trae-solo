import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplicationList from './pages/ApplicationList';
import ApplicationDetail from './pages/ApplicationDetail';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import AlertList from './pages/AlertList';
import AlertDetail from './pages/AlertDetail';
import ChangeList from './pages/ChangeList';
import ChangeDetail from './pages/ChangeDetail';
import LogList from './pages/LogList';
import AuditList from './pages/AuditList';
import Settings from './pages/Settings';

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string[] }) {
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      useAuthStore.getState().fetchMe();
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <PrivateRoute>
            <ApplicationList />
          </PrivateRoute>
        }
      />
      <Route
        path="/applications/:id"
        element={
          <PrivateRoute>
            <ApplicationDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <PrivateRoute>
            <TaskList />
          </PrivateRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <PrivateRoute>
            <TaskDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <PrivateRoute>
            <AlertList />
          </PrivateRoute>
        }
      />
      <Route
        path="/alerts/:id"
        element={
          <PrivateRoute>
            <AlertDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/changes"
        element={
          <PrivateRoute>
            <ChangeList />
          </PrivateRoute>
        }
      />
      <Route
        path="/changes/:id"
        element={
          <PrivateRoute>
            <ChangeDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <PrivateRoute requiredRole={['platform_engineer', 'security_admin']}>
            <LogList />
          </PrivateRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <PrivateRoute requiredRole={['platform_engineer', 'security_admin']}>
            <AuditList />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute requiredRole={['platform_engineer', 'security_admin']}>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
