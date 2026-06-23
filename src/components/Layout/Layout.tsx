import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const pageTitleMap: Record<string, string> = {
  '/': '总控仪表盘',
  '/profile': '用户档案',
  '/meter-reading': '智能抄表',
  '/payment': '缴费中心',
  '/repair': '报修工单',
  '/inspection': '巡检管理',
  '/warning': '安全预警',
  '/gis': 'GIS服务网点',
  '/admin/pricing': '阶梯计价',
  '/admin/outage': '停气排程',
  '/admin/billing': '账单引擎',
  '/admin/reporting': '指标报送',
};

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    return pageTitleMap[location.pathname] || '燃气管理平台';
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileSidebar}
      />

      <Header
        title={getPageTitle()}
        onMenuClick={toggleMobileSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-60'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
