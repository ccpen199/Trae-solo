import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vessels from './pages/Vessels';
import Voyages from './pages/Voyages';
import Schedules from './pages/Schedules';
import Resources from './pages/Resources';
import Adjustments from './pages/Adjustments';

function App() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>🚢 靠泊计划系统</h2>
        <nav>
          <NavLink to="/" end>
            📊 调度总览
          </NavLink>
          <NavLink to="/vessels">
            🚢 船舶基础
          </NavLink>
          <NavLink to="/voyages">
            📋 航次管理
          </NavLink>
          <NavLink to="/schedules">
            📅 泊位排程
          </NavLink>
          <NavLink to="/resources">
            ⚙️ 资源分配
          </NavLink>
          <NavLink to="/adjustments">
            📝 调整记录
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vessels" element={<Vessels />} />
          <Route path="/voyages" element={<Voyages />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/adjustments" element={<Adjustments />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
