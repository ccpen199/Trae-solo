import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AppWindow, 
  FileText, 
  PlayCircle, 
  Bell, 
  Settings, 
  Shield, 
  Terminal,
  History
} from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Applications from './pages/Applications.jsx';
import ApplicationDetail from './pages/ApplicationDetail.jsx';
import ChangeOrders from './pages/ChangeOrders.jsx';
import ChangeOrderDetail from './pages/ChangeOrderDetail.jsx';
import ExecutionTasks from './pages/ExecutionTasks.jsx';
import Alarms from './pages/Alarms.jsx';
import Configuration from './pages/Configuration.jsx';
import Permissions from './pages/Permissions.jsx';
import CallLogs from './pages/CallLogs.jsx';
import OperationLogs from './pages/OperationLogs.jsx';

function App() {
  const navItems = [
    { path: '/', label: '看板', icon: LayoutDashboard },
    { path: '/applications', label: '应用管理', icon: AppWindow },
    { path: '/change-orders', label: '变更单', icon: FileText },
    { path: '/execution-tasks', label: '执行任务', icon: PlayCircle },
    { path: '/alarms', label: '告警记录', icon: Bell },
    { path: '/call-logs', label: '调用日志', icon: Terminal },
    { path: '/operation-logs', label: '操作日志', icon: History },
    { path: '/permissions', label: '权限管理', icon: Shield },
    { path: '/configuration', label: '系统配置', icon: Settings },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>软件资产台账</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className="nav-link"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/change-orders" element={<ChangeOrders />} />
          <Route path="/change-orders/:id" element={<ChangeOrderDetail />} />
          <Route path="/execution-tasks" element={<ExecutionTasks />} />
          <Route path="/alarms" element={<Alarms />} />
          <Route path="/call-logs" element={<CallLogs />} />
          <Route path="/operation-logs" element={<OperationLogs />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
