import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  ChevronDown,
  Home,
  FileText,
  MessageSquare,
  Gavel,
  Briefcase,
  ShieldCheck,
  FileWarning,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  user: '用户端',
  lawyer: '律师端',
  admin: '管理端',
};

const userNavItems = [
  { to: '/home', label: '首页', icon: Home },
  { to: '/submit', label: '提交咨询', icon: FileText },
  { to: '/consultations', label: '我的咨询', icon: MessageSquare },
];

const lawyerNavItems = [
  { to: '/lawyer-hall', label: '抢单大厅', icon: Gavel },
  { to: '/lawyer-cases', label: '我的案件', icon: Briefcase },
];

const adminNavItems = [
  { to: '/admin/verify', label: '资质核验', icon: ShieldCheck },
  { to: '/admin/disputes', label: '纠纷处理', icon: FileWarning },
  { to: '/admin/monitor', label: '监控看板', icon: LayoutDashboard },
];

export function Header() {
  const location = useLocation();
  const { currentUser, role, switchRole } = useAuthStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = role === 'user' ? userNavItems : role === 'lawyer' ? lawyerNavItems : adminNavItems;

  const displayName =
    currentUser && 'nickname' in currentUser
      ? (currentUser as { nickname?: string }).nickname || '用户'
      : '用户';

  const avatar = currentUser && 'avatar' in currentUser
    ? (currentUser as { avatar?: string }).avatar
    : undefined;

  const handleSwitchRole = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-primary-700 border-b border-primary-600/50 shadow-lg">
      <div className="h-16 px-4 md:px-6">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gold/20">
                <Scale className="h-5 w-5 text-accent-gold" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-accent-gold font-serif tracking-wide">
                法援在线
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1 ml-8">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-accent-gold bg-primary-600'
                        : 'text-primary-100 hover:text-accent-gold hover:bg-primary-600/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-0.5 w-8 bg-accent-gold rounded-full"
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/50 text-primary-100 text-sm font-medium hover:bg-primary-600 hover:text-accent-gold transition-colors"
              >
                <span className="text-accent-gold">{roleLabels[role || 'user']}</span>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', roleDropdownOpen && 'rotate-180')}
                />
              </button>
              <AnimatePresence>
                {roleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 mt-2 w-36 rounded-lg bg-white shadow-card-hover border border-primary-100 overflow-hidden"
                  >
                    {(['user', 'lawyer', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSwitchRole(r as UserRole)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors',
                          role === r
                            ? 'text-accent-gold-dark font-medium bg-accent-gold/10'
                            : 'text-primary-700'
                        )}
                      >
                        {roleLabels[r as UserRole]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setRoleDropdownOpen(false);
                }}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gold/20 ring-2 ring-accent-gold/30">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-accent-gold font-medium text-sm">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-accent-gold">{displayName}</p>
                  <p className="text-xs text-primary-300">{roleLabels[role || 'user']}</p>
                </div>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-card-hover border border-primary-100 overflow-hidden"
                  >
                    <button className="w-full text-left px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                      个人中心
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                      设置
                    </button>
                    <div className="border-t border-primary-100" />
                    <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      退出登录
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-primary-100 hover:bg-primary-600/50 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-primary-600/50 bg-primary-700"
          >
            <nav className="flex flex-col p-3 gap-1">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-accent-gold bg-primary-600'
                        : 'text-primary-100 hover:text-accent-gold hover:bg-primary-600/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <div className="border-t border-primary-600/50 my-1" />
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-xs text-primary-300">角色切换</span>
              </div>
              <div className="flex gap-2 px-4">
                {(['user', 'lawyer', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSwitchRole(r)}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors',
                      role === r
                        ? 'bg-accent-gold/20 text-accent-gold'
                        : 'bg-primary-600/50 text-primary-100 hover:text-accent-gold'
                    )}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
