import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Cases from './pages/Cases.jsx';
import CaseDetail from './pages/CaseDetail.jsx';
import Quotations from './pages/Quotations.jsx';
import QuotationDetail from './pages/QuotationDetail.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import ErpSchedules from './pages/ErpSchedules.jsx';
import ErpGantt from './pages/ErpGantt.jsx';
import ErpMaterials from './pages/ErpMaterials.jsx';
import ManagerLogs from './pages/ManagerLogs.jsx';
import ManagerAcceptance from './pages/ManagerAcceptance.jsx';
import ManagerFunds from './pages/ManagerFunds.jsx';
import ManagerDisputes from './pages/ManagerDisputes.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminCompanies from './pages/AdminCompanies.jsx';
import AdminProcess from './pages/AdminProcess.jsx';
import AdminMaterials from './pages/AdminMaterials.jsx';
import AdminComplaints from './pages/AdminComplaints.jsx';
import AdminAuditLogs from './pages/AdminAuditLogs.jsx';
import StyleMigration from './pages/StyleMigration.jsx';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="style-migration" element={<StyleMigration />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="quotations/:id" element={<QuotationDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="erp/schedules" element={<ErpSchedules />} />
        <Route path="erp/gantt" element={<ErpGantt />} />
        <Route path="erp/materials" element={<ErpMaterials />} />
        <Route path="manager/logs" element={<ManagerLogs />} />
        <Route path="manager/acceptance" element={<ManagerAcceptance />} />
        <Route path="manager/funds" element={<ManagerFunds />} />
        <Route path="manager/disputes" element={<ManagerDisputes />} />
        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/companies" element={<AdminCompanies />} />
        <Route path="admin/process" element={<AdminProcess />} />
        <Route path="admin/materials" element={<AdminMaterials />} />
        <Route path="admin/complaints" element={<AdminComplaints />} />
        <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
