import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Rules from './pages/Rules';
import Tasks from './pages/Tasks';
import CallLogs from './pages/CallLogs';
import AuditLogs from './pages/AuditLogs';
import Alerts from './pages/Alerts';
import ChangeOrders from './pages/ChangeOrders';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="rules" element={<Rules />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="call-logs" element={<CallLogs />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="change-orders" element={<ChangeOrders />} />
      </Route>
    </Routes>
  );
}

export default App;
