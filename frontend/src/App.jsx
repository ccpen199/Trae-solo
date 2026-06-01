import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import OrderCreate from './pages/OrderCreate';
import OrderDetail from './pages/OrderDetail';
import Pickings from './pages/Pickings';
import PickingDetail from './pages/PickingDetail';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Settlements from './pages/Settlements';
import SettlementDetail from './pages/SettlementDetail';
import Stores from './pages/Stores';
import Suppliers from './pages/Suppliers';

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>供应链订货平台</h2>
        <nav>
          <NavLink to="/" end>仪表盘</NavLink>
          
          <div className="section-title">门店端</div>
          <NavLink to="/orders">订单管理</NavLink>
          <NavLink to="/receipts">收货管理</NavLink>
          
          <div className="section-title">采购/仓库</div>
          <NavLink to="/products">商品目录</NavLink>
          <NavLink to="/suppliers">供应商</NavLink>
          <NavLink to="/pickings">拣配配送</NavLink>
          
          <div className="section-title">财务</div>
          <NavLink to="/settlements">结算对账</NavLink>
          
          <div className="section-title">基础资料</div>
          <NavLink to="/stores">门店管理</NavLink>
        </nav>
      </aside>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/create" element={<OrderCreate />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/pickings" element={<Pickings />} />
          <Route path="/pickings/:id" element={<PickingDetail />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/:id" element={<ReceiptDetail />} />
          <Route path="/settlements" element={<Settlements />} />
          <Route path="/settlements/:id" element={<SettlementDetail />} />
        </Routes>
      </main>
    </div>
  );
}
