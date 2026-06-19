import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  GraduationCap,
  Newspaper,
  Settings,
  Users,
  BookOpen,
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '数据看板', icon: LayoutDashboard },
  {
    path: '/sanxiaxiang',
    label: '三下乡专项',
    icon: Sun,
    subItems: [
      { path: '/sanxiaxiang/teams', label: '团队申报' },
      { path: '/sanxiaxiang/checkin', label: '行程打卡' },
      { path: '/sanxiaxiang/logs', label: '实践日志' },
    ],
  },
  {
    path: '/scholarship',
    label: '奖学金共享',
    icon: GraduationCap,
    subItems: [
      { path: '/scholarship/projects', label: '资助项目' },
      { path: '/scholarship/donors', label: '捐赠方' },
      { path: '/scholarship/stories', label: '励志故事' },
    ],
  },
  { path: '/news', label: '资讯引擎', icon: Newspaper },
  {
    path: '/admin',
    label: '后台管理',
    icon: Settings,
    subItems: [
      { path: '/admin/credits', label: '学分对接' },
      { path: '/admin/departments', label: '院系管理' },
      { path: '/admin/bases', label: '基地管理' },
    ],
  },
];

const Sidebar = () => {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800">实践管理平台</span>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.path}>
            <NavLink
              to={item.path}
              end={!item.subItems}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
            {item.subItems && (
              <div className="bg-gray-50">
                {item.subItems.map((subItem) => (
                  <NavLink
                    key={subItem.path}
                    to={subItem.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 pl-12 pr-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50/50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {subItem.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">管理员</p>
            <p className="text-xs text-gray-500 truncate">admin@university.edu</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
