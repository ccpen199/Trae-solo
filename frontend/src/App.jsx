import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, Cpu, LayoutGrid, Zap, Mic, Settings, 
  ShoppingBag, Shield, ChevronRight, Menu, X, AlertTriangle
} from 'lucide-react';
import * as api from './api.js';

import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import Rooms from './pages/Rooms.jsx';
import Scenes from './pages/Scenes.jsx';
import Energy from './pages/Energy.jsx';
import Voice from './pages/Voice.jsx';
import Admin from './pages/Admin.jsx';
import Shopping from './pages/Shopping.jsx';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/devices', label: '设备管理', icon: Cpu },
  { path: '/rooms', label: '家庭空间', icon: LayoutGrid },
  { path: '/scenes', label: '场景联动', icon: Zap },
  { path: '/energy', label: '能耗监控', icon: Zap },
  { path: '/voice', label: '语音控制', icon: Mic },
  { path: '/shopping', label: '购物商城', icon: ShoppingBag },
  { path: '/admin', label: '后台管理', icon: Settings },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [systemStatus, setSystemStatus] = useState('healthy');
  const [healthWarnings, setHealthWarnings] = useState([]);
  const location = useLocation();

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadSystemStatus() {
    try {
      const res = await api.getDashboardSummary();
      const data = res.data;
      setSystemStatus(data.systemStatus || 'healthy');
      setHealthWarnings(data.healthWarnings || []);
    } catch (e) {
      console.error('Failed to load system status:', e);
    }
  }

  const statusConfig = {
    healthy: { bg: 'bg-green-500', text: 'text-green-400', label: '正常' },
    warning: { bg: 'bg-amber-500', text: 'text-amber-400', label: '警告' },
    critical: { bg: 'bg-red-500', text: 'text-red-400', label: '严重' }
  };
  const status = statusConfig[systemStatus] || statusConfig.healthy;

  return (
    <div className="flex min-h-screen bg-slate-900">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-white">AIoT 中枢</h1>
              <p className="text-xs text-slate-400">家庭智能管理平台</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${status.bg} animate-pulse`} />
              <span className={`text-sm ${status.text}`}>
                系统{status.label}
              </span>
            </div>
            {healthWarnings.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle size={12} />
                <span>{healthWarnings.length}个健康告警</span>
              </div>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/scenes" element={<Scenes />} />
          <Route path="/energy" element={<Energy />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
