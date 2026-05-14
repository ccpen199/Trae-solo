import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/Toast';
import RequireAuth from './components/RequireAuth';
import BottomNav from './components/BottomNav';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Home from './pages/Home';
import Logistics from './pages/Logistics';
import Reminders from './pages/Reminders';
import ReminderCreate from './pages/ReminderCreate';
import Share from './pages/Share';
import Profile from './pages/Profile';

const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Splash />} />
            <Route path="/home" element={<Home />} />
            <Route path="/share/:id" element={
              <RequireAuth>
                <Share />
              </RequireAuth>
            } />
            
            <Route path="/logistics" element={
              <RequireAuth>
                <Logistics />
              </RequireAuth>
            } />
            
            <Route path="/reminders" element={
              <RequireAuth>
                <Reminders />
              </RequireAuth>
            } />
            <Route path="/reminder/create/:id" element={
              <RequireAuth>
                <ReminderCreate />
              </RequireAuth>
            } />
            
            <Route path="/profile" element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
