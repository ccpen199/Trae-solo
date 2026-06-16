import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Home,
  User,
  Car,
  Heart,
  GraduationCap,
  Building2,
  Building,
  LayoutDashboard,
  Workflow,
  Settings,
  LogOut,
  MapPin,
  Camera,
  FileText,
  Bus,
  Calendar,
  Activity,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/admin-workbench', icon: Sparkles, label: '管理工作台', color: 'primary', admin: true },
  { path: '/dashboard', icon: LayoutDashboard, label: '城市体征', color: 'primary', admin: true },
  { path: '/orchestration', icon: Workflow, label: '服务编排', color: 'eco', admin: true },
  { path: '/ticket-dispatch', icon: ClipboardList, label: '工单分拨调度', color: 'warm', admin: true },
  { path: '/', icon: Home, label: '市民首页', color: 'primary' },
  { path: '/identity', icon: User, label: '数字身份', color: 'primary' },
  {
    path: '/transportation',
    icon: Car,
    label: '交通出行',
    color: 'warm',
    children: [
      { path: '/transportation/brt', icon: Bus, label: 'BRT乘车码' },
      { path: '/transportation/parking', icon: MapPin, label: '智慧停车' },
      { path: '/transportation/violation', icon: Camera, label: '违章查询' },
    ],
  },
  {
    path: '/medical',
    icon: Heart,
    label: '医疗健康',
    color: 'eco',
    children: [
      { path: '/medical/appointment', icon: Calendar, label: '预约挂号' },
      { path: '/medical/heatmap', icon: Activity, label: '候诊热力图' },
    ],
  },
  {
    path: '/education',
    icon: GraduationCap,
    label: '教育服务',
    color: 'primary',
    children: [
      { path: '/education/enrollment', icon: FileText, label: '入学报名' },
    ],
  },
  {
    path: '/government',
    icon: Building2,
    label: '政务服务',
    color: 'primary',
    children: [
      { path: '/government/policy', icon: FileText, label: '政策解读' },
    ],
  },
  {
    path: '/urban',
    icon: Building,
    label: '城市管理',
    color: 'warm',
    children: [
      { path: '/urban/complaint', icon: MessageSquare, label: '12345诉求' },
    ],
  },
  { path: '/profile', icon: Settings, label: '个人中心', color: 'primary' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/transportation', '/medical', '/education', '/government', '/urban']);

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const getColorClass = (color: string, isActive: boolean) => {
    if (isActive) {
      switch (color) {
        case 'warm':
          return 'bg-warm-500 text-white shadow-glow-orange';
        case 'eco':
          return 'bg-eco-500 text-white shadow-glow-green';
        default:
          return 'bg-primary-500 text-white shadow-glow';
      }
    }
    switch (color) {
      case 'warm':
        return 'text-warm-600 hover:bg-warm-50';
      case 'eco':
        return 'text-eco-600 hover:bg-eco-50';
      default:
        return 'text-gray-600 hover:bg-primary-50 hover:text-primary-600';
    }
  };

  const filteredItems = menuItems.filter(item => !item.admin || user?.role === 'admin');

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-glow">
            邕
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">南宁城市服务</h1>
            <p className="text-xs text-gray-500">智慧城市·山水南宁</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {filteredItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.path)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
                      'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {expandedMenus.includes(item.path) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedMenus.includes(item.path) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
                              getColorClass(item.color, isActive)
                            )
                          }
                        >
                          <child.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      getColorClass(item.color, isActive)
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || '用'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{user?.name || '用户'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.phone || ''}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </div>
  );
}
