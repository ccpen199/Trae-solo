import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import TaskHall from './pages/TaskHall';
import TaskDetail from './pages/TaskDetail';
import PublishTask from './pages/PublishTask';
import TalentPool from './pages/TalentPool';
import ProviderDetail from './pages/ProviderDetail';
import Workspace from './pages/Workspace';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">加载中...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">加载中...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/tasks" />} />
                <Route path="/tasks" element={<TaskHall />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/publish" element={<PublishTask />} />
                <Route path="/talents" element={<TalentPool />} />
                <Route path="/providers/:id" element={<ProviderDetail />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
