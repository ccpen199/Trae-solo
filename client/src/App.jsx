import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MerchantList from './pages/merchant/MerchantList.jsx';
import MerchantDetail from './pages/merchant/MerchantDetail.jsx';
import ServiceList from './pages/service/ServiceList.jsx';
import ServiceDetail from './pages/service/ServiceDetail.jsx';
import ServiceCompare from './pages/service/ServiceCompare.jsx';
import CaseList from './pages/case/CaseList.jsx';
import CaseDetail from './pages/case/CaseDetail.jsx';
import MarketingList from './pages/marketing/MarketingList.jsx';
import WeddingCountdown from './pages/couple/WeddingCountdown.jsx';
import BudgetPlanner from './pages/couple/BudgetPlanner.jsx';
import TaskList from './pages/couple/TaskList.jsx';
import OrderList from './pages/order/OrderList.jsx';
import OrderDetail from './pages/order/OrderDetail.jsx';
import KnowledgeGraph from './pages/knowledge/KnowledgeGraph.jsx';
import MerchantDashboard from './pages/merchant/MerchantDashboard.jsx';
import MerchantServices from './pages/merchant/MerchantServices.jsx';
import MerchantCases from './pages/merchant/MerchantCases.jsx';
import MerchantMarketing from './pages/merchant/MerchantMarketing.jsx';
import MerchantOrders from './pages/merchant/MerchantOrders.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMerchants from './pages/admin/AdminMerchants.jsx';
import AdminKnowledge from './pages/admin/AdminKnowledge.jsx';
import AdminManagers from './pages/admin/AdminManagers.jsx';
import AdminDeposits from './pages/admin/AdminDeposits.jsx';
import { isAuthenticated, isAdmin, isMerchant, isCouple } from './utils/auth.js';

const ProtectedRoute = ({ children, roles = [] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => {
      if (role === 'admin') return isAdmin();
      if (role === 'merchant') return isMerchant();
      if (role === 'couple') return isCouple();
      return false;
    });
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        <Route path="merchants" element={<MerchantList />} />
        <Route path="merchants/:id" element={<MerchantDetail />} />
        
        <Route path="services" element={<ServiceList />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="services/compare" element={<ServiceCompare />} />
        
        <Route path="cases" element={<CaseList />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        
        <Route path="marketing" element={<MarketingList />} />
        <Route path="knowledge" element={<KnowledgeGraph />} />
        
        <Route path="couple/countdown" element={
          <ProtectedRoute roles={['couple']}><WeddingCountdown /></ProtectedRoute>
        } />
        <Route path="couple/tasks" element={
          <ProtectedRoute roles={['couple']}><TaskList /></ProtectedRoute>
        } />
        <Route path="couple/budget" element={
          <ProtectedRoute roles={['couple']}><BudgetPlanner /></ProtectedRoute>
        } />
        
        <Route path="orders" element={
          <ProtectedRoute roles={['couple', 'merchant']}><OrderList /></ProtectedRoute>
        } />
        <Route path="orders/:id" element={
          <ProtectedRoute roles={['couple', 'merchant']}><OrderDetail /></ProtectedRoute>
        } />
        
        <Route path="merchant/dashboard" element={
          <ProtectedRoute roles={['merchant']}><MerchantDashboard /></ProtectedRoute>
        } />
        <Route path="merchant/services" element={
          <ProtectedRoute roles={['merchant']}><MerchantServices /></ProtectedRoute>
        } />
        <Route path="merchant/cases" element={
          <ProtectedRoute roles={['merchant']}><MerchantCases /></ProtectedRoute>
        } />
        <Route path="merchant/marketing" element={
          <ProtectedRoute roles={['merchant']}><MerchantMarketing /></ProtectedRoute>
        } />
        <Route path="merchant/orders" element={
          <ProtectedRoute roles={['merchant']}><MerchantOrders /></ProtectedRoute>
        } />
        
        <Route path="admin/dashboard" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="admin/merchants" element={
          <ProtectedRoute roles={['admin']}><AdminMerchants /></ProtectedRoute>
        } />
        <Route path="admin/knowledge" element={
          <ProtectedRoute roles={['admin']}><AdminKnowledge /></ProtectedRoute>
        } />
        <Route path="admin/managers" element={
          <ProtectedRoute roles={['admin']}><AdminManagers /></ProtectedRoute>
        } />
        <Route path="admin/deposits" element={
          <ProtectedRoute roles={['admin']}><AdminDeposits /></ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
