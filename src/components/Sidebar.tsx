import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Users,
  Calendar,
  LayoutDashboard,
  ShieldAlert,
  UserCog,
  Eye,
  FileCheck,
  LogOut,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  role: UserRole;
}

const enterpriseNav = [
  { path: '/enterprise/certification', icon: FileCheck, label: '企业认证' },
  { path: '/enterprise/jobs', icon: Briefcase, label: '职位管理' },
  { path: '/enterprise/resumes', icon: FileText, label: '简历匹配' },
  { path: '/enterprise/interviews', icon: Calendar, label: '面试邀约' },
  { path: '/admin/dashboard', icon: LayoutDashboard, label: '数据看板' },
];

const applicantNav = [
  { path: '/applicant/home', icon: Briefcase, label: '推荐职位' },
  { path: '/applicant/applications', icon: FileText, label: '投递记录' },
];

const adminNav = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: '数据看板' },
  { path: '/admin/blacklist', icon: ShieldAlert, label: '黑名单库' },
  { path: '/admin/fraud-detection', icon: Eye, label: '虚假职位识别' },
  { path: '/admin/interview-tracking', icon: Users, label: '面试跟踪' },
  { path: '/admin/user-management', icon: UserCog, label: '用户管理' },
];

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const navItems =
    role === 'enterprise'
      ? enterpriseNav
      : role === 'applicant'
        ? applicantNav
        : adminNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 min-h-screen bg-white border-r border-ash-100 flex flex-col shadow-soft">
      <div className="p-6 border-b border-ash-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-500 to-spruce-500 flex items-center justify-center">
            <span className="text-white font-serif font-bold text-lg">云</span>
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-ash-700">云聘·云南</h1>
            <p className="text-xs text-ash-400">区域化B2B招聘平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <item.icon size={20} strokeWidth={2} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ash-100 space-y-3">
        <div className="px-4 py-3 bg-ash-50 rounded-lg">
          <p className="text-sm font-medium text-ash-700 truncate">{user?.name}</p>
          <p className="text-xs text-ash-400">{user?.phone}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-ash-500 hover:bg-ash-50 hover:text-terracotta-600 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </div>
  );
}
