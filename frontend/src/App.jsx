import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StationMap from './pages/StationMap';
import Orders from './pages/Orders';
import Devices from './pages/Devices';
import WorkOrders from './pages/WorkOrders';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Pricing from './pages/Pricing';
import VehicleFlow from './pages/VehicleFlow';
import Reservation from './pages/Reservation';

function App() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-title">🚗 智慧充电停车系统</div>
        
        <div className="sidebar-section">车主服务</div>
        <ul className="sidebar-menu">
          <li><NavLink to="/vehicle">🚙 车主流程</NavLink></li>
          <li><NavLink to="/reservation">📅 车位预约</NavLink></li>
          <li><NavLink to="/orders">📋 我的订单</NavLink></li>
        </ul>
        
        <div className="sidebar-section">运营管理</div>
        <ul className="sidebar-menu">
          <li><NavLink to="/" end>📊 运营总览</NavLink></li>
          <li><NavLink to="/map">🗺️ 场站地图</NavLink></li>
          <li><NavLink to="/orders">📝 订单管理</NavLink></li>
          <li><NavLink to="/users">👥 用户管理</NavLink></li>
          <li><NavLink to="/pricing">💰 计费规则</NavLink></li>
        </ul>
        
        <div className="sidebar-section">运维管理</div>
        <ul className="sidebar-menu">
          <li><NavLink to="/devices">🔧 设备管理</NavLink></li>
          <li><NavLink to="/workorders">📑 工单系统</NavLink></li>
        </ul>
        
        <div className="sidebar-section">财务分析</div>
        <ul className="sidebar-menu">
          <li><NavLink to="/reports">📈 报表分析</NavLink></li>
        </ul>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<StationMap />} />
          <Route path="/vehicle" element={<VehicleFlow />} />
          <Route path="/reservation" element={<Reservation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/workorders" element={<WorkOrders />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;