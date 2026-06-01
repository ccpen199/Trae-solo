import React, { useState, useEffect, Component } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Bids from './pages/Bids';
import BidDetail from './pages/BidDetail';
import Ledger from './pages/Ledger';
import Exceptions from './pages/Exceptions';
import Qualifications from './pages/Qualifications';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#fff' }}>
          <h2>页面加载出错</h2>
          <p>{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Auth check error:', e);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', background: '#f0f2f5', minHeight: '100vh' }}>加载中...</div>;
  }

  const ProtectedLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return (
      <MainLayout user={user} onLogout={handleLogout} />
    );
  };

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bids" element={<Bids />} />
          <Route path="/bids/:id" element={<BidDetail />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/qualifications" element={<Qualifications />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
