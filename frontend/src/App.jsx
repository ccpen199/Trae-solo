import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';

const App = () => {
  return (
    <div className="font-sans min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/search" element={<Search />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/user/:userId" element={<UserProfile />} />
      </Routes>
    </div>
  );
};

export default App;
