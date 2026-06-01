import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import KittingBoard from './pages/KittingBoard';
import WorkOrderKitting from './pages/WorkOrderKitting';
import WorkOrders from './pages/WorkOrders';
import BOMManagement from './pages/BOMManagement';
import InventoryManagement from './pages/InventoryManagement';
import SubstituteManagement from './pages/SubstituteManagement';
import MaterialIssueReturn from './pages/MaterialIssueReturn';

const menuItems = [
  { key: '/', label: <Link to="/">齐套看板</Link> },
  { key: '/work-orders', label: <Link to="/work-orders">工单管理</Link> },
  { key: '/kitting', label: <Link to="/kitting">工单齐套</Link> },
  { key: '/boms', label: <Link to="/boms">BOM管理</Link> },
  { key: '/inventory', label: <Link to="/inventory">库存管理</Link> },
  { key: '/substitutes', label: <Link to="/substitutes">替代料规则</Link> },
  { key: '/issue-return', label: <Link to="/issue-return">领料退料</Link> },
];

function App() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-title">物料齐套检查系统</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ minWidth: 0, flex: 1, background: 'transparent' }}
        />
      </header>
      <main className="app-content">
        <Routes>
          <Route path="/" element={<KittingBoard />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/kitting" element={<WorkOrderKitting />} />
          <Route path="/boms" element={<BOMManagement />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/substitutes" element={<SubstituteManagement />} />
          <Route path="/issue-return" element={<MaterialIssueReturn />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
