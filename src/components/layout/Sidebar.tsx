import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  FileEdit,
  FlaskConical,
  Library,
  BarChart3,
  User,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/create', icon: MessageSquare, label: 'AI创作' },
  { to: '/editor/resume-1', icon: FileEdit, label: '简历编辑' },
  { to: '/lab', icon: FlaskConical, label: '简历实验室' },
  { to: '/cases', icon: Library, label: '发现分类' },
  { to: '/admin', icon: BarChart3, label: '后台管理' },
  { to: '/profile', icon: User, label: '个人中心' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[72px] bg-brand-900 flex flex-col items-center py-6 gap-2 shrink-0">
      <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-6">
        <Sparkles className="w-5 h-5 text-white" />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to.split('/').slice(0, 2).join('/')));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all duration-200 group relative
                ${isActive
                  ? 'bg-brand-800 text-brand-400'
                  : 'text-brand-600 hover:text-brand-300 hover:bg-brand-800/50'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-body font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-500 rounded-r-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-brand-300 text-xs font-body font-bold mt-auto">
        U
      </div>
    </aside>
  );
}
