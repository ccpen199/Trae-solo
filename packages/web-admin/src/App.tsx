import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Avatar, Dropdown, Badge, Breadcrumb } from 'antd';
import {
  DashboardOutlined, FileSearchOutlined, SafetyCertificateOutlined, AlertOutlined,
  DollarOutlined, ToolOutlined, SettingOutlined, LogoutOutlined, UserOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, CarOutlined, TeamOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ApprovalWorkbench from '@/pages/ApprovalWorkbench';
import AlertMonitorPage from '@/pages/AlertMonitorPage';
import FundManagementPage from '@/pages/FundManagementPage';
import CityConfigPage from '@/pages/CityConfigPage';
import OrdersManagePage from '@/pages/OrdersManagePage';
import CouriersManagePage from '@/pages/CouriersManagePage';

const menuData = [
  { key: '/', label: '运营驾驶舱', icon: <DashboardOutlined /> },
  { key: '/orders', label: '订单总览', icon: <FileSearchOutlined /> },
  { key: '/approval', label: '审批工作台', icon: <AuditOutlined /> },
  { key: '/couriers', label: '揽收员管理', icon: <TeamOutlined /> },
  { key: '/alerts', label: 'SLA预警监控', icon: <AlertOutlined /> },
  { key: '/funds', label: '资金监管', icon: <DollarOutlined /> },
  { key: '/cities', label: '地市配置', icon: <ToolOutlined /> },
];

const breadcrumbMap: Record<string, string[]> = {
  '/': ['首页', '驾驶舱'],
  '/orders': ['首页', '订单', '订单总览'],
  '/approval': ['首页', '审批', '工作台'],
  '/couriers': ['首页', '人员', '揽收员管理'],
  '/alerts': ['首页', '监控', 'SLA预警'],
  '/funds': ['首页', '资金', '监管台账'],
  '/cities': ['首页', '配置', '地市服务配置'],
};

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const loc = useLocation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount] = useState(5);

  return (
    <div className="admin-layout">
      <div className={`admin-sider ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sider-logo" style={{ flexDirection: collapsed ? 'column' : 'row' }}>
          {collapsed ? '📮' : (<>📮 <span style={{ marginLeft: 6 }}>邮政政务平台</span></>)}
        </div>
        <div className="admin-sider-menu">
          {menuData.map(m => (
            <div key={m.key} className={`menu-item ${loc.pathname === m.key ? 'active' : ''}`} onClick={() => navigate(m.key)}>
              <span className="icon">{m.icon}</span>
              {!collapsed && <span>{m.label}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="admin-content">
        <div className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {collapsed
              ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ cursor: 'pointer', fontSize: 18 }} />
              : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ cursor: 'pointer', fontSize: 18 }} />
            }
            <div className="admin-header-title">邮政政务便民服务协同平台 · 运营后台</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={alertCount} size="small">
              <BellOutlined style={{ fontSize: 18, color: '#595959', cursor: 'pointer' }} onClick={() => navigate('/alerts')} />
            </Badge>
            <Dropdown
              menu={{ items: [
                { key: '1', label: '个人中心', icon: <UserOutlined /> },
                { type: 'divider' },
                { key: '2', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } },
              ] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" style={{ background: '#00B42A' }} icon={<UserOutlined />} />
                <span style={{ fontSize: 13 }}>{user?.realNameMasked || '管理员'}
                  <span style={{ color: '#999', marginLeft: 6, fontSize: 12 }}>({user?.role || 'OPERATOR'})</span>
                </span>
              </div>
            </Dropdown>
          </div>
        </div>
        <div style={{ padding: '0 20px 10px' }}>
          <Breadcrumb items={(breadcrumbMap[loc.pathname] || []).map(b => ({ title: b }))} />
        </div>
        <div className="admin-body">{children}</div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<Protected><Layout><Routes>
      <Route index element={<DashboardPage />} />
      <Route path="orders" element={<OrdersManagePage />} />
      <Route path="approval" element={<ApprovalWorkbench />} />
      <Route path="couriers" element={<CouriersManagePage />} />
      <Route path="alerts" element={<AlertMonitorPage />} />
      <Route path="funds" element={<FundManagementPage />} />
      <Route path="cities" element={<CityConfigPage />} />
    </Routes></Layout></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
