import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';

import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import HouseList from '@/pages/HouseList';
import HouseDetail from '@/pages/HouseDetail';
import OrderList from '@/pages/OrderList';
import OrderDetail from '@/pages/OrderDetail';
import Favorites from '@/pages/Favorites';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import DemandPage from '@/pages/Demand';
import LandlordDashboard from '@/pages/LandlordDashboard';

function PrivateRoute({ children, requireLandlord = false }) {
  const { user, token } = useUserStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireLandlord && user?.role !== 'landlord') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function GuestRoute({ children }) {
  const { token } = useUserStore();
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  const { token, fetchCurrentUser } = useUserStore();

  useEffect(() => {
    if (token) {
      fetchCurrentUser().catch(() => {});
    }
  }, [token, fetchCurrentUser]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/houses" element={<HouseList />} />
        <Route path="/houses/:id" element={<HouseDetail />} />
        <Route path="/demands" element={<DemandPage />} />
        
        <Route 
          path="/orders" 
          element={
            <PrivateRoute>
              <OrderList />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders/:id" 
          element={
            <PrivateRoute>
              <OrderDetail />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/favorites" 
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/messages" 
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/landlord" 
          element={
            <PrivateRoute requireLandlord={true}>
              <LandlordDashboard />
            </PrivateRoute>
          } 
        />
      </Route>
      
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } 
      />
      
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
