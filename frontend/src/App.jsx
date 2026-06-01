import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Materials from './pages/Materials';
import Results from './pages/Results';
import Todos from './pages/Todos';

function App() {
  const [user, setUser] = useState({ name: '管理员', role: 'admin' });

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>信用修复服务系统</h2>
        <nav>
          <NavLink to="/" end>服务看板</NavLink>
          <NavLink to="/customers">客户档案</NavLink>
          <NavLink to="/materials">材料审核</NavLink>
          <NavLink to="/results">结果归档</NavLink>
          <NavLink to="/todos">待办事项</NavLink>
        </nav>
      </aside>
      <main className="main">
        <div className="header">
          <h1>信用修复管理系统</h1>
          <span>欢迎，{user.name}</span>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/results" element={<Results />} />
          <Route path="/todos" element={<Todos />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
