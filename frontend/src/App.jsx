import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Suppliers from './pages/Suppliers.jsx';
import SupplierDetail from './pages/SupplierDetail.jsx';
import Assessments from './pages/Assessments.jsx';
import AssessmentDetail from './pages/AssessmentDetail.jsx';
import Questionnaires from './pages/Questionnaires.jsx';
import Rectifications from './pages/Rectifications.jsx';
import Reports from './pages/Reports.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <h2>ESG 评估系统</h2>
          <nav>
            <NavLink to="/" end>
              数据概览
            </NavLink>
            <NavLink to="/suppliers">
              供应商管理
            </NavLink>
            <NavLink to="/assessments">
              ESG 评估
            </NavLink>
            <NavLink to="/questionnaires">
              问卷配置
            </NavLink>
            <NavLink to="/rectifications">
              整改管理
            </NavLink>
            <NavLink to="/reports">
              验收报表
            </NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/assessments/:id" element={<AssessmentDetail />} />
            <Route path="/questionnaires" element={<Questionnaires />} />
            <Route path="/rectifications" element={<Rectifications />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
