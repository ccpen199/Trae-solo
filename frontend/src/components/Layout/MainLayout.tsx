import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/': '工作台',
  '/properties': '房源管理',
  '/properties/new': '录入房源',
  '/customers': '客源管理',
  '/customers/new': '录入客源',
  '/crawler': '房源抓取',
  '/crawler/review': '审核入库',
  '/promotion': '推广中心',
  '/demands': '抢单大厅',
  '/demands/mine': '我的抢单',
  '/commissions': '佣金结算',
  '/knowledge': '知识社区',
  '/knowledge/new': '发布内容',
  '/profile': '个人中心',
};

const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    for (const [pattern, title] of Object.entries(pageTitles)) {
      if (path === pattern || path.startsWith(pattern + '/')) {
        return title;
      }
    }
    return '房地产中介数字化作业系统';
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle()} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
