import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Environments from './pages/Environments';
import Strategies from './pages/Strategies';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import ChangeOrders from './pages/ChangeOrders';
import ChangeOrderDetail from './pages/ChangeOrderDetail';
import AuditLogs from './pages/AuditLogs';
import Alerts from './pages/Alerts';
import Exceptions from './pages/Exceptions';
import Reports from './pages/Reports';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="environments" element={<Environments />} />
        <Route path="strategies" element={<Strategies />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="change-orders" element={<ChangeOrders />} />
        <Route path="change-orders/:id" element={<ChangeOrderDetail />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
