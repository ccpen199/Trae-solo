import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/DailyLog/Dashboard';
import DailyLogPage from './pages/DailyLog/DailyLogPage';
import './components/Layout.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/daily-logs"
        element={
          <PrivateRoute>
            <Layout>
              <DailyLogPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/logs"
        element={
          <PrivateRoute>
            <Layout>
              <div className="page-header">
                <h2>部门日志</h2>
                <p>查看部门员工日志</p>
              </div>
              <div className="card">
                <div className="empty-state">
                  <p>部门日志管理功能</p>
                </div>
              </div>
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/missing"
        element={
          <PrivateRoute>
            <Layout>
              <div className="page-header">
                <h2>缺失提醒</h2>
                <p>查看未提交日志的员工</p>
              </div>
              <div className="card">
                <div className="empty-state">
                  <p>缺失提醒管理功能</p>
                </div>
              </div>
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <PrivateRoute>
            <Layout>
              <div className="page-header">
                <h2>统计报表</h2>
                <p>查看系统统计数据</p>
              </div>
              <div className="card">
                <div className="empty-state">
                  <p>统计报表功能</p>
                </div>
              </div>
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <Layout>
              <div className="page-header">
                <h2>用户管理</h2>
                <p>管理系统用户</p>
              </div>
              <div className="card">
                <div className="empty-state">
                  <p>用户管理功能</p>
                </div>
              </div>
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <PrivateRoute>
            <Layout>
              <div className="page-header">
                <h2>部门管理</h2>
                <p>管理系统部门</p>
              </div>
              <div className="card">
                <div className="empty-state">
                  <p>部门管理功能</p>
                </div>
              </div>
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
