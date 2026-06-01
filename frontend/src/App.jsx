import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Optometry from './pages/Optometry.jsx';
import OptometryForm from './pages/OptometryForm.jsx';
import Orders from './pages/Orders.jsx';
import OrderForm from './pages/OrderForm.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Processing from './pages/Processing.jsx';

function App() {
  const menuItems = [
    { path: '/', label: '工作台', exact: true },
    { path: '/customers', label: '客户管理' },
    { path: '/optometry', label: '验光记录' },
    { path: '/orders', label: '配镜订单' },
    { path: '/processing', label: '加工管理' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">验光配镜系统</div>
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-title">眼科门诊管理系统</div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/optometry" element={<Optometry />} />
            <Route path="/optometry/new" element={<OptometryForm />} />
            <Route path="/optometry/:id/edit" element={<OptometryForm />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/processing" element={<Processing />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
