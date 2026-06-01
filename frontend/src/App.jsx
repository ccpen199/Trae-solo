import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ElderlyList from './pages/ElderlyList';
import ElderlyDetail from './pages/ElderlyDetail';
import CarePlans from './pages/CarePlans';
import Medication from './pages/Medication';
import Incidents from './pages/Incidents';
import FeeManagement from './pages/FeeManagement';
import FamilyView from './pages/FamilyView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#333',
        background: 'white',
        minHeight: '100vh'
      }}>
        加载中...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/elderly" element={<ElderlyList user={user} />} />
        <Route path="/elderly/:id" element={<ElderlyDetail user={user} />} />
        <Route path="/care-plans" element={<CarePlans user={user} />} />
        <Route path="/medication" element={<Medication user={user} />} />
        <Route path="/incidents" element={<Incidents user={user} />} />
        <Route path="/fees" element={<FeeManagement user={user} />} />
        <Route path="/family" element={<FamilyView user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
