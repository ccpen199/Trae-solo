import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import ClueList from './pages/ClueList';
import ClueDetail from './pages/ClueDetail';
import ClueCreate from './pages/ClueCreate';
import Logs from './pages/Logs';
import TestCenter from './pages/TestCenter';

interface User {
  id: number;
  username: string;
  real_name: string;
  role: string;
  security_level: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <MainLayout user={user} onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }} /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="clues" element={<ClueList />} />
        <Route path="clues/:id" element={<ClueDetail />} />
        <Route path="clues/create" element={<ClueCreate />} />
        <Route path="logs" element={<Logs />} />
        <Route path="test" element={<TestCenter />} />
      </Route>
    </Routes>
  );
}

export default App;
