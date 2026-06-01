import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Positions from './pages/Positions';
import Candidates from './pages/Candidates';
import SlaWarnings from './pages/SlaWarnings';
import ClientView from './pages/ClientView';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, requireRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireRole && user.role !== requireRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/client-view" element={<ClientView />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="projects" element={<Projects />} />
        <Route path="positions" element={<Positions />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="sla-warnings" element={<SlaWarnings />} />
      </Route>
    </Routes>
  );
}

export default App;
