import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Activate from './pages/Activate';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRisk from './pages/admin/Risk';
import AdminReconciliation from './pages/admin/Reconciliation';
import AdminAudit from './pages/admin/Audit';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('walletUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('walletUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('walletUser');
  };

  const updateUser = (userData) => {
    const updated = { ...user, ...userData };
    setUser(updated);
    localStorage.setItem('walletUser', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/activate" element={
          <PrivateRoute>
            <Activate />
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/payment" element={
          <PrivateRoute>
            <Payment />
          </PrivateRoute>
        } />
        <Route path="/transfer" element={
          <PrivateRoute>
            <Transfer />
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/risk" element={
          <PrivateRoute>
            <AdminRisk />
          </PrivateRoute>
        } />
        <Route path="/admin/reconciliation" element={
          <PrivateRoute>
            <AdminReconciliation />
          </PrivateRoute>
        } />
        <Route path="/admin/audit" element={
          <PrivateRoute>
            <AdminAudit />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
};

export default App;
