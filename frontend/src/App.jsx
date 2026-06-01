import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import Contracts from './pages/Contracts.jsx';
import Devices from './pages/Devices.jsx';
import Bills from './pages/Bills.jsx';
import Collection from './pages/Collection.jsx';

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>设备租赁风控系统</h2>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            📊 风控看板
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
            👥 客户授信
          </NavLink>
          <NavLink to="/contracts" className={({ isActive }) => isActive ? 'active' : ''}>
            📑 租赁合同
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => isActive ? 'active' : ''}>
            🖥️ 设备台账
          </NavLink>
          <NavLink to="/bills" className={({ isActive }) => isActive ? 'active' : ''}>
            💰 账单收款
          </NavLink>
          <NavLink to="/collection" className={({ isActive }) => isActive ? 'active' : ''}>
            📞 催收工作台
          </NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/collection" element={<Collection />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
