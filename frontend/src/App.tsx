import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Wallet from './pages/Wallet';
import Passport from './pages/Passport';
import './styles.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/passport" element={<Passport />} />
          <Route path="/base" element={
            <div className="container">
              <div className="header">
                <h1>⭐ 星球基地</h1>
                <p>建设中...</p>
              </div>
              <div className="card">
                <div className="empty">敬请期待</div>
              </div>
            </div>
          } />
          <Route path="/settings" element={
            <div className="container">
              <div className="header">
                <h1>⚙️ 设置</h1>
                <p>系统设置</p>
              </div>
              <div className="card">
                <div className="empty">更多功能开发中...</div>
              </div>
            </div>
          } />
        </Routes>
        <Navigation />
      </Router>
    </AuthProvider>
  );
};

export default App;
