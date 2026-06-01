import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import MainLayout from './components/MainLayout.jsx';
import Workbench from './pages/Workbench.jsx';
import ApplicationList from './pages/ApplicationList.jsx';
import ApplicationDetail from './pages/ApplicationDetail.jsx';
import TaskList from './pages/TaskList.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import ChangeOrderList from './pages/ChangeOrderList.jsx';
import ChangeOrderDetail from './pages/ChangeOrderDetail.jsx';
import AlertList from './pages/AlertList.jsx';
import AuditLog from './pages/AuditLog.jsx';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/workbench" replace />} />
        <Route path="workbench" element={<Workbench />} />
        <Route path="applications" element={<ApplicationList />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="change-orders" element={<ChangeOrderList />} />
        <Route path="change-orders/:id" element={<ChangeOrderDetail />} />
        <Route path="alerts" element={<AlertList />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  );
}

export default App;
