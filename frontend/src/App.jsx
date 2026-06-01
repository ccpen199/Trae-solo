import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Documents from './pages/Documents';
import Accounting from './pages/Accounting';
import TaxDeclarations from './pages/TaxDeclarations';
import MonthlyReports from './pages/MonthlyReports';
import Renewals from './pages/Renewals';
import Todos from './pages/Todos';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute roles={['admin', 'accountant', 'manager']}><Clients /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/accounting" element={<ProtectedRoute roles={['admin', 'accountant', 'manager']}><Accounting /></ProtectedRoute>} />
      <Route path="/tax" element={<ProtectedRoute roles={['admin', 'accountant', 'manager']}><TaxDeclarations /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><MonthlyReports /></ProtectedRoute>} />
      <Route path="/renewals" element={<ProtectedRoute roles={['admin', 'accountant', 'manager']}><Renewals /></ProtectedRoute>} />
      <Route path="/todos" element={<ProtectedRoute><Todos /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
