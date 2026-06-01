import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import ServiceOrders from './pages/ServiceOrders';
import Reports from './pages/Reports';

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">家电延保管理</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>工作台</NavLink>
          <NavLink to="/products">延保产品</NavLink>
          <NavLink to="/policies">保单管理</NavLink>
          <NavLink to="/claims">理赔申请</NavLink>
          <NavLink to="/service-orders">服务工单</NavLink>
          <NavLink to="/reports">运营报表</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <header className="header">
          <h1>家电延保销售与理赔管理系统</h1>
          <span style={{ color: '#999' }}>v1.0.0</span>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/service-orders" element={<ServiceOrders />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
