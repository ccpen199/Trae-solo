import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Picking from './pages/Picking.jsx';
import PickingDetail from './pages/PickingDetail.jsx';
import ReviewExecute from './pages/ReviewExecute.jsx';
import ReviewAudit from './pages/ReviewAudit.jsx';
import Delivery from './pages/Delivery.jsx';
import AfterSale from './pages/AfterSale.jsx';

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>生鲜履约系统</h2>
        <nav>
          <NavLink to="/" end>运营看板</NavLink>
          <NavLink to="/inventory">库存管理</NavLink>
          <NavLink to="/orders">订单管理</NavLink>
          <NavLink to="/picking">拣货任务</NavLink>
          <NavLink to="/review-execute">复核执行</NavLink>
          <NavLink to="/review-audit">复核审核</NavLink>
          <NavLink to="/delivery">配送管理</NavLink>
          <NavLink to="/aftersale">售后处理</NavLink>
        </nav>
      </aside>
      <div className="main">
        <header className="header">
          <span>前置仓履约中心</span>
          <span>{new Date().toLocaleDateString('zh-CN')}</span>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/picking" element={<Picking />} />
            <Route path="/picking/:id" element={<PickingDetail />} />
            <Route path="/review-execute" element={<ReviewExecute />} />
            <Route path="/review-audit" element={<ReviewAudit />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/aftersale" element={<AfterSale />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
