import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CitySelector from './pages/CitySelector';
import CarTypeSelector from './pages/CarTypeSelector';
import WaitingPage from './pages/WaitingPage';
import TripPage from './pages/TripPage';
import PaymentPage from './pages/PaymentPage';
import RatingPage from './pages/RatingPage';
import MessagePage from './pages/MessagePage';
import ChatPage from './pages/ChatPage';
import AnnouncementPage from './pages/AnnouncementPage';
import AnnouncementDetail from './pages/AnnouncementDetail';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

const GuestRoute = ({ children, redirectTo }) => {
  const { isLoggedIn } = useAuthStore();
  if (!isLoggedIn && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

const App = () => {
  const { isLoggedIn, token } = useAuthStore();
  
  useEffect(() => {
    if (token && isLoggedIn) {
      localStorage.setItem('token', token);
    }
  }, [token, isLoggedIn]);

  return (
    <div className="page-container">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/city-selector" element={<CitySelector />} />
        <Route path="/announcement" element={<AnnouncementPage />} />
        <Route path="/announcement/:id" element={<AnnouncementDetail />} />
        
        <Route path="/" element={<HomePage />} />
        
        <Route path="/car-type" element={
          <ProtectedRoute>
            <CarTypeSelector />
          </ProtectedRoute>
        } />
        
        <Route path="/waiting/:orderId" element={
          <ProtectedRoute>
            <WaitingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/trip/:orderId" element={
          <ProtectedRoute>
            <TripPage />
          </ProtectedRoute>
        } />
        
        <Route path="/payment/:orderId" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        
        <Route path="/rating/:orderId" element={
          <ProtectedRoute>
            <RatingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/messages" element={<MessagePage />} />
        
        <Route path="/chat/:orderId" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrderHistoryPage />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;