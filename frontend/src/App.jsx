import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import PlanDetail from './pages/PlanDetail.jsx';
import Notes from './pages/Notes.jsx';
import Discussions from './pages/Discussions.jsx';
import TopicDetail from './pages/TopicDetail.jsx';
import Activities from './pages/Activities.jsx';
import ActivityDetail from './pages/ActivityDetail.jsx';
import Admin from './pages/Admin.jsx';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <div className="text-center mt-8">加载中...</div>;
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" />;
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/" />;
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
        <Route path="/plans/:id" element={<PlanDetail user={user} onLogout={handleLogout} />} />
        <Route path="/notes" element={<Notes user={user} onLogout={handleLogout} />} />
        <Route path="/discussions" element={<Discussions user={user} onLogout={handleLogout} />} />
        <Route path="/discussions/:id" element={<TopicDetail user={user} onLogout={handleLogout} />} />
        <Route path="/activities" element={<Activities user={user} onLogout={handleLogout} />} />
        <Route path="/activities/:id" element={<ActivityDetail user={user} onLogout={handleLogout} />} />
        <Route path="/admin" element={<Admin user={user} onLogout={handleLogout} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
