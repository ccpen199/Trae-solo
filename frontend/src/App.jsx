import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FamilyProfiles from './pages/FamilyProfiles.jsx';
import Assessments from './pages/Assessments.jsx';
import ConsultationPlans from './pages/ConsultationPlans.jsx';
import FollowUpRecords from './pages/FollowUpRecords.jsx';
import Reports from './pages/Reports.jsx';

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="family-profiles" element={<FamilyProfiles />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="consultation-plans" element={<ConsultationPlans />} />
        <Route path="follow-up-records" element={<FollowUpRecords />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
