import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './store/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const AccountsPage = React.lazy(() => import('./pages/Accounts'));
const PaymentsPage = React.lazy(() => import('./pages/Payments'));
const ReconciliationPage = React.lazy(() => import('./pages/Reconciliation'));
const ForecastPage = React.lazy(() => import('./pages/Forecast'));
const AuditPage = React.lazy(() => import('./pages/Audit'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <React.Suspense
      fallback={
        <div className="loading-container">
          <Spin size="large" />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navigate to="/dashboard" replace />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <PrivateRoute>
              <Layout>
                <AccountsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PrivateRoute>
              <Layout>
                <PaymentsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/reconciliation"
          element={
            <PrivateRoute>
              <Layout>
                <ReconciliationPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/forecast"
          element={
            <PrivateRoute>
              <Layout>
                <ForecastPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <PrivateRoute>
              <Layout>
                <AuditPage />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </React.Suspense>
  );
};

export default App;
