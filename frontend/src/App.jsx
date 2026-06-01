import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Orders from './pages/Orders.jsx';
import Stores from './pages/Stores.jsx';
import Customers from './pages/Customers.jsx';
import Maintenances from './pages/Maintenances.jsx';
import Violations from './pages/Violations.jsx';
import Inspections from './pages/Inspections.jsx';
import Financial from './pages/Financial.jsx';

function App() {
  const menuItems = [
    { path: '/', label: '仪表盘', exact: true },
    { path: '/vehicles', label: '车辆管理' },
    { path: '/orders', label: '订单管理' },
    { path: '/customers', label: '客户管理' },
    { path: '/stores', label: '门店管理' },
    { path: '/maintenances', label: '保养维修' },
    { path: '/violations', label: '违章管理' },
    { path: '/inspections', label: '验收管理' },
    { path: '/financial', label: '财务管理' },
  ];

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-logo">🚗 车队管理系统</div>
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                end={item.exact}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/maintenances" element={<Maintenances />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/financial" element={<Financial />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
