import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProcessFlow from './pages/ProcessFlow.jsx';
import Batches from './pages/Batches.jsx';
import Monitoring from './pages/Monitoring.jsx';
import Alerts from './pages/Alerts.jsx';
import CorrectiveActions from './pages/CorrectiveActions.jsx';
import Verification from './pages/Verification.jsx';
import SelfTest from './pages/SelfTest.jsx';
import Traceability from './pages/Traceability.jsx';

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>HACCP 管理系统</h2>
        <nav>
          <NavLink to="/" end>仪表盘</NavLink>
          <NavLink to="/products">产品管理</NavLink>
          <NavLink to="/process">工艺流程</NavLink>
          <NavLink to="/batches">批次管理</NavLink>
          <NavLink to="/monitoring">监测记录</NavLink>
          <NavLink to="/alerts">预警管理</NavLink>
          <NavLink to="/corrective">纠偏行动</NavLink>
          <NavLink to="/verification">验证内审</NavLink>
          <NavLink to="/traceability">批次追溯</NavLink>
          <NavLink to="/selftest">系统自测</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/process" element={<ProcessFlow />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/corrective" element={<CorrectiveActions />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="/selftest" element={<SelfTest />} />
        </Routes>
      </main>
    </div>
  );
}
