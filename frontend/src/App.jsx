import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import StationList from './pages/StationList.jsx';
import StationDetail from './pages/StationDetail.jsx';
import ChargerDetail from './pages/ChargerDetail.jsx';
import Recommendation from './pages/Recommendation.jsx';
import ChargingMonitor from './pages/ChargingMonitor.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import DeviceHealth from './pages/admin/DeviceHealth.jsx';
import AlarmWorkOrders from './pages/admin/AlarmWorkOrders.jsx';
import PriceStrategy from './pages/admin/PriceStrategy.jsx';
import RevenueReport from './pages/admin/RevenueReport.jsx';
import { createWebSocket } from './api';

function App() {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      try {
        ws = createWebSocket();
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
        
        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          setWsConnected(false);
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <span>⚡</span>
          依威能源 - 充电智能调度平台
        </h1>
        <nav>
          <NavLink to="/" end>
            车主端
          </NavLink>
          <NavLink to="/stations">
            充电站
          </NavLink>
          <NavLink to="/recommendation">
            智能推荐
          </NavLink>
          <NavLink to="/charging">
            充电监测
          </NavLink>
          <NavLink to="/admin">
            运营管理
          </NavLink>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            opacity: 0.85
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: wsConnected ? '#52c41a' : '#8c8c8c'
            }} />
            {wsConnected ? '实时同步' : '连接中断'}
          </div>
        </nav>
      </header>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stations" element={<StationList />} />
          <Route path="/stations/:id" element={<StationDetail />} />
          <Route path="/chargers/:id" element={<ChargerDetail />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/charging" element={<ChargingMonitor />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/devices" element={<DeviceHealth />} />
          <Route path="/admin/alarms" element={<AlarmWorkOrders />} />
          <Route path="/admin/pricing" element={<PriceStrategy />} />
          <Route path="/admin/revenue" element={<RevenueReport />} />
        </Routes>
      </main>
      
      <footer className="footer">
        <p>© 2026 依威能源 EV Energy - 新能源汽车充电基础设施智能调度平台 | 支持国标GB/T协议与OCPP 1.6通信协议</p>
      </footer>
    </div>
  );
}

export default App;
