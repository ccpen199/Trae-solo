import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import LawyerList from './pages/LawyerList';
import LawyerDetail from './pages/LawyerDetail';
import Consultation from './pages/Consultation';
import ConsultationList from './pages/ConsultationList';
import ConsultationDetail from './pages/ConsultationDetail';
import ContractGenerator from './pages/ContractGenerator';
import ContractList from './pages/ContractList';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import LawyerDashboard from './pages/lawyer/Dashboard';
import LawyerCases from './pages/lawyer/Cases';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAudits from './pages/admin/Audits';
import AdminNPS from './pages/admin/NPS';
import AdminCompliance from './pages/admin/Compliance';
import AdminLawyerVerify from './pages/admin/LawyerVerify';
import ContentCenter from './pages/ContentCenter';
import CompanyVip from './pages/CompanyVip';
import AdminDocumentSandbox from './pages/admin/DocumentSandbox';
import AdminRevenue from './pages/admin/Revenue';
import './App.css';

const { Content } = Layout;

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('role');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setRole(userRole);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUser(null);
        setRole(null);
      }
    } else if (token || userData || userRole) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  }, []);

  const handleLogin = (userData, userRole, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
    setUser(userData);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Layout className="app-layout">
          <Navbar user={user} role={role} onLogout={handleLogout} />
          <Content className="app-content">
            <Routes>
              <Route path="/" element={<Home user={user} role={role} />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
              <Route path="/lawyers" element={<LawyerList />} />
              <Route path="/lawyers/:id" element={<LawyerDetail />} />
              <Route path="/consultation" element={<Consultation user={user} role={role} />} />
              <Route path="/consultations" element={<ConsultationList user={user} role={role} />} />
              <Route path="/consultations/:id" element={<ConsultationDetail user={user} role={role} />} />
              <Route path="/contracts/generate" element={<ContractGenerator user={user} role={role} />} />
              <Route path="/contracts" element={<ContractList user={user} role={role} />} />
              <Route path="/cases" element={<CaseList user={user} role={role} />} />
              <Route path="/cases/:id" element={<CaseDetail user={user} role={role} />} />
              <Route path="/content" element={<ContentCenter />} />
              <Route path="/company-vip" element={<CompanyVip />} />
              <Route path="/lawyer/dashboard" element={role === 'lawyer' ? <LawyerDashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/lawyer/cases" element={role === 'lawyer' ? <LawyerCases user={user} /> : <Navigate to="/login" />} />
              <Route path="/admin/dashboard" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
              <Route path="/admin/audits" element={role === 'admin' ? <AdminAudits /> : <Navigate to="/login" />} />
              <Route path="/admin/nps" element={role === 'admin' ? <AdminNPS /> : <Navigate to="/login" />} />
              <Route path="/admin/compliance" element={role === 'admin' ? <AdminCompliance /> : <Navigate to="/login" />} />
              <Route path="/admin/lawyer-verify" element={role === 'admin' ? <AdminLawyerVerify /> : <Navigate to="/login" />} />
              <Route path="/admin/document-sandbox" element={role === 'admin' ? <AdminDocumentSandbox /> : <Navigate to="/login" />} />
              <Route path="/admin/revenue" element={role === 'admin' ? <AdminRevenue /> : <Navigate to="/login" />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
