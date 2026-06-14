import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import JobListPage from './pages/JobListPage.jsx';
import JobDetailPage from './pages/JobDetailPage.jsx';
import JobseekerDashboard from './pages/JobseekerDashboard.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import MessagePage from './pages/MessagePage.jsx';
import api from './utils/api.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} user={user} />} />
        <Route path="/register" element={<RegisterPage onLogin={handleLogin} user={user} />} />
        <Route path="/jobs" element={<JobListPage user={user} />} />
        <Route path="/jobs/:id" element={<JobDetailPage user={user} />} />
        <Route path="/messages/:userId?" element={user ? <MessagePage user={user} /> : <Navigate to="/login" />} />
        <Route 
          path="/jobseeker/*" 
          element={user?.role === 'jobseeker' ? <JobseekerDashboard user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/employer/*" 
          element={user?.role === 'employer' ? <EmployerDashboard user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/*" 
          element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App;
