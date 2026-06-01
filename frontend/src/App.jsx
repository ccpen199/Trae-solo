import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import FactoryList from './pages/FactoryList.jsx';
import FactoryDetail from './pages/FactoryDetail.jsx';
import Audit from './pages/Audit.jsx';

const App = () => {
  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>🏭 工厂档案系统</h1>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              数据看板
            </NavLink>
            <NavLink to="/factories" className={({ isActive }) => isActive ? 'active' : ''}>
              工厂名录
            </NavLink>
            <NavLink to="/audit" className={({ isActive }) => isActive ? 'active' : ''}>
              运营审核
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/factories" element={<FactoryList />} />
            <Route path="/factories/:id" element={<FactoryDetail />} />
            <Route path="/audit" element={<Audit />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
