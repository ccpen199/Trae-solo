import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import SalesControl from './pages/SalesControl.jsx';
import PropertyList from './pages/PropertyList.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import Approvals from './pages/Approvals.jsx';
import Finance from './pages/Finance.jsx';
import Statistics from './pages/Statistics.jsx';
import api from './utils/api.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/sales-control" replace />} />
        <Route path="/sales-control" element={<SalesControl user={user} />} />
        <Route path="/properties" element={<PropertyList user={user} />} />
        <Route path="/subscriptions" element={<Subscriptions user={user} />} />
        <Route path="/approvals" element={<Approvals user={user} />} />
        <Route path="/finance" element={<Finance user={user} />} />
        <Route path="/statistics" element={<Statistics user={user} />} />
      </Routes>
    </Layout>
  );
}

export default App;
