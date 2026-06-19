import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/': '校级数据看板',
  '/sanxiaxiang': '三下乡专项',
  '/sanxiaxiang/teams': '团队申报',
  '/sanxiaxiang/checkin': '行程打卡',
  '/sanxiaxiang/logs': '实践日志',
  '/scholarship': '奖学金共享',
  '/scholarship/projects': '资助项目',
  '/scholarship/donors': '捐赠方',
  '/scholarship/stories': '励志故事',
  '/news': '资讯引擎',
  '/admin': '后台管理',
  '/admin/credits': '学分对接',
  '/admin/departments': '院系管理',
  '/admin/bases': '基地管理',
};

const Layout = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || '社会实践管理平台';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Header title={title} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
