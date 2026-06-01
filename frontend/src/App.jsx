import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scales from './pages/Scales';
import Plans from './pages/Plans';
import Assessment from './pages/Assessment';
import Results from './pages/Results';
import Interventions from './pages/Interventions';
import Todos from './pages/Todos';
import Users from './pages/Users';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scales" element={<Scales />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/assessment/:planId" element={<Assessment />} />
          <Route path="/results" element={<Results />} />
          <Route path="/interventions" element={<Interventions />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
