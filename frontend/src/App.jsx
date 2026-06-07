import React from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RescueCenter from './pages/RescueCenter';
import MentorApprentice from './pages/MentorApprentice';
import Community from './pages/Community';
import Courses from './pages/Courses';
import PartsBom from './pages/PartsBom';
import Admin from './pages/Admin';
import FaultCodes from './pages/FaultCodes';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const titles = {
      '/': '仪表盘',
      '/rescue': '紧急救援调度中心',
      '/mentor': '师徒管理',
      '/community': '兄弟圈',
      '/courses': '兄弟学院',
      '/parts': '配件BOM匹配',
      '/admin': '管理后台',
      '/fault-codes': '故障代码库'
    };
    return titles[location.pathname] || '仪表盘';
  };

  const navItems = [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/rescue', label: '紧急救援', icon: '🚨' },
    { path: '/mentor', label: '师徒管理', icon: '👨‍🏫' },
    { path: '/community', label: '兄弟圈', icon: '👥' },
    { path: '/courses', label: '兄弟学院', icon: '📚' },
    { path: '/parts', label: '搜索查询', icon: '🔧' },
    { path: '/fault-codes', label: '分类发现', icon: '⚠️' },
    { path: '/admin', label: '管理后台', icon: '⚙️' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fc' }}>
      <aside style={{
        width: '240px',
        backgroundColor: '#1e293b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>🚛</span>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>卡车后市场平台</h1>
        </div>
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => navigate(item.path)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: isActive ? 'white' : '#94a3b8',
                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                transition: 'all 0.2s'
              })}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          borderBottom: '1px solid #e3e6f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#5a5c69' }}>{getPageTitle()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#858796' }}>欢迎，管理员</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#4e73df',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>A</div>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rescue" element={<RescueCenter />} />
            <Route path="/mentor" element={<MentorApprentice />} />
            <Route path="/community" element={<Community />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/parts" element={<PartsBom />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/fault-codes" element={<FaultCodes />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
