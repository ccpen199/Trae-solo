import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Licenses from './pages/Licenses';
import LicenseDetail from './pages/LicenseDetail';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Monitor from './pages/Monitor';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <Layout />
        }>
          <Route index element={<Services />} />
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<ServiceDetail />} />
          <Route path="licenses" element={
            <ProtectedRoute>
              <Licenses />
            </ProtectedRoute>
          } />
          <Route path="licenses/:id" element={
            <ProtectedRoute>
              <LicenseDetail />
            </ProtectedRoute>
          } />
          <Route path="applications" element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          } />
          <Route path="applications/:id" element={
            <ProtectedRoute>
              <ApplicationDetail />
            </ProtectedRoute>
          } />
          <Route path="monitor" element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <Monitor />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
