import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from './store';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import DeviceList from './pages/devices/DeviceList';
import DeviceBind from './pages/devices/DeviceBind';
import DataSync from './pages/devices/DataSync';
import GoalList from './pages/goals/GoalList';
import GoalCreate from './pages/goals/GoalCreate';
import PlanList from './pages/goals/PlanList';
import PlanGenerate from './pages/goals/PlanGenerate';
import WorkoutList from './pages/workouts/WorkoutList';
import WorkoutCreate from './pages/workouts/WorkoutCreate';
import WorkoutDetail from './pages/workouts/WorkoutDetail';
import AlertList from './pages/alerts/AlertList';
import CoachDashboard from './pages/coach/CoachDashboard';
import UserDetail from './pages/coach/UserDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import OperationLogs from './pages/admin/OperationLogs';
import Reports from './pages/admin/Reports';

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="devices" element={<DeviceList />} />
        <Route path="devices/bind" element={<DeviceBind />} />
        <Route path="devices/sync" element={<DataSync />} />
        <Route path="goals" element={<GoalList />} />
        <Route path="goals/create" element={<GoalCreate />} />
        <Route path="plans" element={<PlanList />} />
        <Route path="plans/generate" element={<PlanGenerate />} />
        <Route path="workouts" element={<WorkoutList />} />
        <Route path="workouts/create" element={<WorkoutCreate />} />
        <Route path="workouts/:id" element={<WorkoutDetail />} />
        <Route path="alerts" element={<AlertList />} />
        <Route
          path="coach"
          element={
            <PrivateRoute roles={['coach', 'advisor', 'admin']}>
              <CoachDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="coach/user/:userId"
          element={
            <PrivateRoute roles={['coach', 'advisor', 'admin']}>
              <UserDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <PrivateRoute roles={['admin', 'advisor']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/logs"
          element={
            <PrivateRoute roles={['admin', 'advisor']}>
              <OperationLogs />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <PrivateRoute roles={['admin', 'advisor']}>
              <Reports />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
