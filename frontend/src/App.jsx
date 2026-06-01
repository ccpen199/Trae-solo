import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import DispatchBoard from './pages/DispatchBoard';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Fees from './pages/Fees';
import Customers from './pages/Customers';

function NavLinks() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '数据看板' },
    { path: '/orders', label: '订单管理' },
    { path: '/dispatch', label: '调度看板' },
    { path: '/drivers', label: '司机管理' },
    { path: '/vehicles', label: '车辆管理' },
    { path: '/fees', label: '费用管理' },
    { path: '/customers', label: '客户管理' },
  ];
  
  return (
    <nav className="nav">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>🚛 拖车派单系统</h1>
          <NavLinks />
        </header>
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/dispatch" element={<DispatchBoard />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
