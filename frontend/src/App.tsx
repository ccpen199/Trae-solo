import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserCenter from './pages/UserCenter';
import AgentDashboard from './pages/agent/Dashboard';
import DeveloperDashboard from './pages/developer/Dashboard';
import TransactionList from './pages/TransactionList';
import TransactionDetail from './pages/TransactionDetail';
import Governance from './pages/Governance';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    if (userData.profile) {
      localStorage.setItem('profile', JSON.stringify(userData.profile));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
  };

  const ProtectedRoute = ({ children, role }: { children: JSX.Element; role?: string }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (role && user.role !== role && user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />}>
          <Route index element={<Home />} />
          <Route path="properties/:type" element={<PropertyList />} />
          <Route path="property/:id" element={<PropertyDetail user={user} />} />
          <Route path="user" element={
            <ProtectedRoute>
              <UserCenter user={user} />
            </ProtectedRoute>
          } />
          <Route path="transactions" element={
            <ProtectedRoute>
              <TransactionList user={user} />
            </ProtectedRoute>
          } />
          <Route path="transaction/:id" element={
            <ProtectedRoute>
              <TransactionDetail />
            </ProtectedRoute>
          } />
          <Route path="agent/dashboard" element={
            <ProtectedRoute role="agent">
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="developer/dashboard" element={
            <ProtectedRoute role="developer">
              <DeveloperDashboard />
            </ProtectedRoute>
          } />
          <Route path="governance" element={<Governance user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
