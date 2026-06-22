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
  AlertTriangle,
  Check,
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
  const isCertified = useAuthStore((s) => s.isCertified);

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

      {role === 'enterprise' && !isCertified && (
        <div className="mx-4 mt-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-terracotta-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-terracotta-700">企业认证未完成</p>
              <p className="text-xs text-terracotta-600 mt-0.5">
                完成营业执照核验和法人实名绑定后，才能发布职位、查看简历、邀约面试。
              </p>
              <button
                onClick={() => navigate('/enterprise/certification')}
                className="mt-2 w-full text-xs py-1.5 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors font-medium"
              >
                立即完成认证
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'enterprise' && isCertified && (
        <div className="mx-4 mt-4 p-3 bg-spruce-50 border border-spruce-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-spruce-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-spruce-700">企业认证已通过</p>
              <p className="text-xs text-spruce-600 mt-0.5">全部招聘功能已解锁</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const locked = role === 'enterprise' && !isCertified && item.path !== '/enterprise/certification';
          return (
            <NavLink
              key={item.path}
              to={locked ? '/enterprise/certification' : item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                if (locked) e.preventDefault();
              }}
            >
              <item.icon size={20} strokeWidth={2} />
              <span className="font-medium">{item.label}</span>
              {locked && <span className="text-xs text-terracotta-500 ml-auto">🔒</span>}
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
