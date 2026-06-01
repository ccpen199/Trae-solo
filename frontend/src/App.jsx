import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ChangeOrders from './pages/ChangeOrders';
import Execution from './pages/Execution';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import LowCodeWorkbench from './pages/LowCodeWorkbench';
import Layout from './components/Layout';
import './styles/lowcode.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><Layout><Applications /></Layout></PrivateRoute>} />
      <Route path="/applications/:appId/lowcode" element={<PrivateRoute><Layout><LowCodeWorkbench /></Layout></PrivateRoute>} />
      <Route path="/change-orders" element={<PrivateRoute><Layout><ChangeOrders /></Layout></PrivateRoute>} />
      <Route path="/execution" element={<PrivateRoute><Layout><Execution /></Layout></PrivateRoute>} />
      <Route path="/audit" element={<PrivateRoute><Layout><Audit /></Layout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
    </Routes>
  );
}

export default App;
