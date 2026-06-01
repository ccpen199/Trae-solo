import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
import Appointments from './pages/Appointments.jsx';
import Services from './pages/Services.jsx';
import Reports from './pages/Reports.jsx';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🏪 预约到店服务系统</h1>
        <nav className="nav">
          <NavLink to="/" end>首页</NavLink>
          <NavLink to="/booking">在线预约</NavLink>
          <NavLink to="/appointments">预约管理</NavLink>
          <NavLink to="/services">服务项目</NavLink>
          <NavLink to="/reports">运营报表</NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/services" element={<Services />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
