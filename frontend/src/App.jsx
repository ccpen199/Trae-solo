import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Profile from './pages/Profile';
import Publish from './pages/Publish';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

function App() {
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const ProtectedRoute = ({ children }) => {
    const token = useAuthStore((state) => state.token);
    return token ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    const admin = useAuthStore((state) => state.admin);
    return admin ? children : <Navigate to="/admin/login" />;
  };

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />
      
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/jobs" element={<Layout><Jobs /></Layout>} />
      <Route path="/jobs/:id" element={<Layout><JobDetail /></Layout>} />
      <Route path="/properties" element={<Layout><Properties /></Layout>} />
      <Route path="/properties/:id" element={<Layout><PropertyDetail /></Layout>} />
      <Route path="/cars" element={<Layout><Cars /></Layout>} />
      <Route path="/cars/:id" element={<Layout><CarDetail /></Layout>} />
      <Route path="/news" element={<Layout><News /></Layout>} />
      <Route path="/news/:id" element={<Layout><NewsDetail /></Layout>} />
      <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
      <Route path="/publish" element={<Layout><ProtectedRoute><Publish /></ProtectedRoute></Layout>} />
    </Routes>
  );
}

export default App;
