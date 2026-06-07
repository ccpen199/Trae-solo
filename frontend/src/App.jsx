import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import InsuredList from './pages/InsuredList.jsx'
import InsuredDetail from './pages/InsuredDetail.jsx'
import CredentialList from './pages/CredentialList.jsx'
import PrescriptionList from './pages/PrescriptionList.jsx'
import PrescriptionDetail from './pages/PrescriptionDetail.jsx'
import OffsiteList from './pages/OffsiteList.jsx'
import SettlementList from './pages/SettlementList.jsx'
import AlertsList from './pages/AlertsList.jsx'
import VerificationList from './pages/VerificationList.jsx'
import FamilyList from './pages/FamilyList.jsx'
import InstitutionsList from './pages/InstitutionsList.jsx'
import PolicyList from './pages/PolicyList.jsx'

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🏥 医保数字基座</h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              📊 运营总览
            </NavLink>
          </li>
          <li>
            <NavLink to="/insured" className={({ isActive }) => isActive ? 'active' : ''}>
              👤 参保人管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/credentials" className={({ isActive }) => isActive ? 'active' : ''}>
              🎫 电子凭证
            </NavLink>
          </li>
          <li>
            <NavLink to="/prescriptions" className={({ isActive }) => isActive ? 'active' : ''}>
              📋 处方流转
            </NavLink>
          </li>
          <li>
            <NavLink to="/offsite" className={({ isActive }) => isActive ? 'active' : ''}>
              🌍 异地就医
            </NavLink>
          </li>
          <li>
            <NavLink to="/settlements" className={({ isActive }) => isActive ? 'active' : ''}>
              💰 结算记录
            </NavLink>
          </li>
          <li>
            <NavLink to="/alerts" className={({ isActive }) => isActive ? 'active' : ''}>
              ⚠️ 异常预警
            </NavLink>
          </li>
          <li>
            <NavLink to="/verifications" className={({ isActive }) => isActive ? 'active' : ''}>
              📹 资格认证
            </NavLink>
          </li>
          <li>
            <NavLink to="/family" className={({ isActive }) => isActive ? 'active' : ''}>
              👨‍👩‍👧‍👦 家庭共济
            </NavLink>
          </li>
          <li>
            <NavLink to="/institutions" className={({ isActive }) => isActive ? 'active' : ''}>
              🏨 医药机构
            </NavLink>
          </li>
          <li>
            <NavLink to="/policies" className={({ isActive }) => isActive ? 'active' : ''}>
              📚 政策图谱
            </NavLink>
          </li>
        </ul>
      </aside>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/insured" element={<InsuredList />} />
          <Route path="/insured/:id" element={<InsuredDetail />} />
          <Route path="/credentials" element={<CredentialList />} />
          <Route path="/prescriptions" element={<PrescriptionList />} />
          <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />
          <Route path="/offsite" element={<OffsiteList />} />
          <Route path="/settlements" element={<SettlementList />} />
          <Route path="/alerts" element={<AlertsList />} />
          <Route path="/verifications" element={<VerificationList />} />
          <Route path="/family" element={<FamilyList />} />
          <Route path="/institutions" element={<InstitutionsList />} />
          <Route path="/policies" element={<PolicyList />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
