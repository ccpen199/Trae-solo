import { useState } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../../pages/Dashboard';
import Profile from '../../pages/Profile';
import Settings from '../../pages/Settings';

const pageTitleMap: Record<string, string> = {
  '/': '仪表盘',
  '/profile': '个人中心',
  '/settings': '系统设置',
  '/people/qrcode': '我的二维码',
  '/people/customers': '客户管理',
  '/people/share': '分享传播',
  '/goods/products': '产品中心',
  '/goods/inventory': '库存管理',
  '/goods/promotion': '促销活动',
  '/field/stores': '生活馆管理',
  '/field/appointments': '预约管理',
  '/field/services': '服务记录',
  '/field/reviews': '客户评价',
  '/compliance/monitor': '风控监控',
  '/compliance/speech': '话术审核',
  '/compliance/withdraw': '提现审核',
  '/compliance/geofence': '地理围栏',
  '/training/courses': '学习中心',
  '/training/exam': '在线考试',
  '/training/ranking': '业绩排行',
  '/analytics/team': '团队裂变',
  '/analytics/sales': '动销分析',
  '/analytics/market': '市场预警',
};

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitleMap)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return title;
      }
    }
    return '仪表盘';
  };

  return (
    <div className="flex h-full bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle()} />
        
        <main className="flex-1 overflow-auto p-6 scrollbar-thin animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Outlet />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
