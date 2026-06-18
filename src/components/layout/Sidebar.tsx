import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  MapPin,
  BookOpen,
  Award,
  Heart,
  Newspaper,
  Calendar,
  Building2,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  X,
  FileCheck,
  FileText,
  ClipboardList,
  PlusCircle,
  Star,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/constants/enums';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const studentNav: NavSection[] = [
  {
    title: '概览',
    items: [{ label: '首页仪表盘', icon: LayoutDashboard, path: '/' }],
  },
  {
    title: '三下乡',
    items: [
      { label: '我的团队', icon: Users, path: '/sanxiaxiang/teams' },
      { label: '轨迹打卡', icon: MapPin, path: '/sanxiaxiang/checkin' },
      { label: '实践日志', icon: BookOpen, path: '/sanxiaxiang/journals' },
    ],
  },
  {
    title: '实践活动',
    items: [
      { label: '活动大厅', icon: Calendar, path: '/activities' },
      { label: '实践基地', icon: Building2, path: '/bases' },
    ],
  },
  {
    title: '学分认证',
    items: [
      { label: '学分申请', icon: FileCheck, path: '/credits/apply' },
      { label: '第二课堂成绩单', icon: FileText, path: '/credits/transcript' },
    ],
  },
  {
    title: '奖学金',
    items: [
      { label: '资助项目', icon: Award, path: '/scholarship/projects' },
      { label: '受助故事', icon: Heart, path: '/scholarship/stories' },
    ],
  },
  {
    title: '资讯',
    items: [{ label: '资讯引擎', icon: Newspaper, path: '/news' }],
  },
];

const adminNav: NavSection[] = [
  {
    title: '概览',
    items: [{ label: '管理员工作台', icon: LayoutDashboard, path: '/' }],
  },
  {
    title: '三下乡管理',
    items: [
      { label: '团队申报管理', icon: Users, path: '/sanxiaxiang/teams' },
      { label: '轨迹打卡', icon: MapPin, path: '/sanxiaxiang/checkin' },
      { label: '日志管理', icon: BookOpen, path: '/sanxiaxiang/journals' },
    ],
  },
  {
    title: '活动管理',
    items: [{ label: '实践活动', icon: Calendar, path: '/activities' }],
  },
  {
    title: '基地管理',
    items: [{ label: '实践基地', icon: Building2, path: '/bases' }],
  },
  {
    title: '学分管理',
    items: [
      { label: '学分审核', icon: ClipboardList, path: '/credits/audit' },
      { label: '学分申请', icon: FileCheck, path: '/credits/apply' },
      { label: '成绩单', icon: FileText, path: '/credits/transcript' },
    ],
  },
  {
    title: '奖学金',
    items: [
      { label: '资助项目', icon: Award, path: '/scholarship/projects' },
      { label: '受助故事', icon: Heart, path: '/scholarship/stories' },
    ],
  },
  {
    title: '资讯',
    items: [{ label: '资讯引擎', icon: Newspaper, path: '/news' }],
  },
  {
    title: '系统管理',
    items: [
      { label: '校级数据看板', icon: BarChart3, path: '/dashboard' },
      { label: '系统设置', icon: Settings, path: '/settings' },
    ],
  },
];

const baseNav: NavSection[] = [
  {
    title: '概览',
    items: [{ label: '基地工作台', icon: LayoutDashboard, path: '/' }],
  },
  {
    title: '岗位管理',
    items: [
      { label: '发布的岗位', icon: FileText, path: '/bases' },
      { label: '发布新岗位', icon: PlusCircle, path: '/bases' },
    ],
  },
  {
    title: '团队接待',
    items: [
      { label: '接待团队', icon: Users, path: '/bases' },
      { label: '满意度评价', icon: Star, path: '/bases' },
    ],
  },
  {
    title: '基地信息',
    items: [
      { label: '基地资料', icon: Building2, path: '/settings' },
      { label: '数据统计', icon: BarChart3, path: '/settings' },
    ],
  },
  {
    title: '资讯',
    items: [{ label: '资讯引擎', icon: Newspaper, path: '/news' }],
  },
];

const donorNav: NavSection[] = [
  {
    title: '概览',
    items: [{ label: '捐赠方工作台', icon: LayoutDashboard, path: '/' }],
  },
  {
    title: '资助项目',
    items: [
      { label: '我的项目', icon: Award, path: '/scholarship/projects' },
      { label: '发布新项目', icon: PlusCircle, path: '/scholarship/projects' },
    ],
  },
  {
    title: '受助管理',
    items: [
      { label: '受助学生', icon: Users, path: '/scholarship/projects' },
      { label: '受助故事', icon: Heart, path: '/scholarship/stories' },
    ],
  },
  {
    title: '资讯',
    items: [{ label: '资讯引擎', icon: Newspaper, path: '/news' }],
  },
  {
    title: '账户设置',
    items: [{ label: '机构资料', icon: Settings, path: '/settings' }],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const isAdmin = user?.role === 'school_admin' || user?.role === 'department_admin';
  const isBase = user?.role === 'base';
  const isDonor = user?.role === 'donor';

  let navSections = studentNav;
  if (isAdmin) navSections = adminNav;
  else if (isBase) navSections = baseNav;
  else if (isDonor) navSections = donorNav;

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleLabel = user?.role ? UserRole[user.role as keyof typeof UserRole]?.label : '';
  const roleIcon = isAdmin ? '👔' : user?.role === 'base' ? '🏛️' : user?.role === 'donor' ? '💝' : '🎓';

  const sidebarContent = (
    <div className="flex h-full flex-col bg-surface-900 text-white">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-surface-700/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-wide">社会实践</span>
          <p className="text-[10px] text-surface-400 -mt-0.5">协同管理平台</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto md:hidden rounded-lg p-1 hover:bg-surface-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections[section.title];
          const isSystemSection = section.title === '系统管理';

          return (
            <div key={section.title} className="mb-1">
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                  isSystemSection ? 'text-accent-300' : 'text-surface-400 hover:text-surface-200'
                )}
              >
                <span>{section.title}</span>
                <motion.div
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5',
                            isActive
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                              : 'text-surface-300 hover:bg-surface-700 hover:text-white'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="flex items-center gap-3 w-full"
                          >
                            <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-white')} />
                            <span className="flex-1">{item.label}</span>
                          </motion.div>
                        )}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-surface-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.avatar || ''}
              alt={user?.name || ''}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-surface-600"
            />
            <span className="absolute -bottom-0.5 -right-0.5 text-[10px] bg-surface-900 rounded-full px-0.5">
              {roleIcon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            {roleLabel && (
              <span className="inline-block rounded-full bg-primary-600/20 px-2 py-0.5 text-[11px] text-primary-300 mt-0.5">
                {roleLabel}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-700 hover:text-white"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:fixed md:inset-y-0">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
