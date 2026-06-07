import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Activities from './pages/Activities.jsx';
import ActivityDetail from './pages/ActivityDetail.jsx';
import Volunteers from './pages/Volunteers.jsx';
import VolunteerDetail from './pages/VolunteerDetail.jsx';
import Organizations from './pages/Organizations.jsx';
import Yicoin from './pages/Yicoin.jsx';
import Community from './pages/Community.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('volunteer_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (userData) => {
    const user = {
      ...userData.user,
      volunteer: userData.volunteer
    };
    localStorage.setItem('volunteer_user', JSON.stringify(user));
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('volunteer_user');
    setUser(null);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <span>🤝</span>
          <span>志愿公益平台</span>
        </div>
        <div className="navbar-menu">
          <NavLink to="/" end>首页</NavLink>
          <NavLink to="/activities">活动中心</NavLink>
          <NavLink to="/volunteers">志愿者</NavLink>
          <NavLink to="/organizations">志愿组织</NavLink>
          <NavLink to="/yicoin">益币中心</NavLink>
          <NavLink to="/community">公益圈</NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin">管理后台</NavLink>
          )}
        </div>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <span>👤 {user.username} {user.role === 'admin' ? '(管理员)' : user.volunteer ? `(${user.volunteer.name})` : ''}</span>
              <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary">登录</NavLink>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/activities" element={<Activities user={user} />} />
        <Route path="/activities/:id" element={<ActivityDetail user={user} />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/volunteers/:id" element={<VolunteerDetail user={user} />} />
        <Route path="/organizations" element={<Organizations user={user} />} />
        <Route path="/yicoin" element={<Yicoin user={user} />} />
        <Route path="/community" element={<Community user={user} />} />
        <Route path="/admin" element={user?.role === 'admin' ? <Admin user={user} /> : <Navigate to="/" />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
      </Routes>
    </div>
  );
}

export default App;
