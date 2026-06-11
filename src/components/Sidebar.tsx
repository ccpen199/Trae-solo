import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import {
  LayoutDashboard,
  UserCircle,
  QrCode,
  GitBranch,
  Share2,
  Package,
  Search,
  Warehouse,
  Tag,
  Store,
  CalendarCheck,
  ClipboardList,
  Star,
  Shield,
  MessageSquareWarning,
  Banknote,
  MapPin,
  GraduationCap,
  BookOpen,
  FileQuestion,
  Trophy,
  BarChart3,
  Network,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Leaf,
} from 'lucide-react'
import { useState } from 'react'

interface NavGroup {
  label: string
  icon: React.ReactNode
  path?: string
  children?: { label: string; path: string; icon: React.ReactNode }[]
}

const navGroups: NavGroup[] = [
  {
    label: '首页',
    icon: <LayoutDashboard size={20} />,
    path: '/',
  },
  {
    label: '展业空间',
    icon: <UserCircle size={20} />,
    children: [
      { label: '个人主页', path: '/exhibition', icon: <UserCircle size={16} /> },
      { label: '专属二维码', path: '/exhibition/qrcode', icon: <QrCode size={16} /> },
      { label: '客户图谱', path: '/exhibition/customers', icon: <GitBranch size={16} /> },
      { label: '传播追踪', path: '/exhibition/tracking', icon: <Share2 size={16} /> },
    ],
  },
  {
    label: '产品中心',
    icon: <Package size={20} />,
    children: [
      { label: '产品列表', path: '/products', icon: <Package size={16} /> },
      { label: '批次溯源', path: '/products/trace', icon: <Search size={16} /> },
      { label: '库存同步', path: '/products/inventory', icon: <Warehouse size={16} /> },
      { label: '促销活动', path: '/products/promotions', icon: <Tag size={16} /> },
    ],
  },
  {
    label: '生活馆',
    icon: <Store size={20} />,
    children: [
      { label: '生活馆列表', path: '/stores', icon: <Store size={16} /> },
      { label: '预约到店', path: '/stores/appointments', icon: <CalendarCheck size={16} /> },
      { label: '服务记录', path: '/stores/services', icon: <ClipboardList size={16} /> },
      { label: '评价聚合', path: '/stores/reviews', icon: <Star size={16} /> },
    ],
  },
  {
    label: '合规风控',
    icon: <Shield size={20} />,
    children: [
      { label: '风控总览', path: '/compliance', icon: <Shield size={16} /> },
      { label: '话术识别', path: '/compliance/speech', icon: <MessageSquareWarning size={16} /> },
      { label: '反洗钱校验', path: '/compliance/aml', icon: <Banknote size={16} /> },
      { label: '地理围栏', path: '/compliance/geofence', icon: <MapPin size={16} /> },
    ],
  },
  {
    label: '培训激励',
    icon: <GraduationCap size={20} />,
    children: [
      { label: '培训总览', path: '/training', icon: <GraduationCap size={16} /> },
      { label: '课件中心', path: '/training/courses', icon: <BookOpen size={16} /> },
      { label: '考试题库', path: '/training/exams', icon: <FileQuestion size={16} /> },
      { label: '业绩排行', path: '/training/rankings', icon: <Trophy size={16} /> },
    ],
  },
  {
    label: '数据看板',
    icon: <BarChart3 size={20} />,
    children: [
      { label: '看板总览', path: '/dashboard', icon: <BarChart3 size={16} /> },
      { label: '裂变图谱', path: '/dashboard/fission', icon: <Network size={16} /> },
      { label: '动销分析', path: '/dashboard/sales', icon: <TrendingUp size={16} /> },
      { label: '饱和度预警', path: '/dashboard/saturation', icon: <AlertTriangle size={16} /> },
    ],
  },
]

export default function Sidebar() {
  const { sidebarCollapsed } = useAppStore()
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['展业空间', '产品中心'])

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white z-40 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <Leaf size={20} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="font-serif text-sm font-bold tracking-wide truncate">新时代展业平台</h1>
              <p className="text-[10px] text-gray-400 truncate">健康产业协同系统</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {group.path ? (
              <NavLink
                to={group.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive(group.path)
                    ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-400'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{group.icon}</span>
                {!sidebarCollapsed && <span>{group.label}</span>}
              </NavLink>
            ) : (
              <>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    group.children?.some((c) => isActive(c.path))
                      ? 'text-emerald-400'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className="flex-shrink-0">{group.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      {expandedGroups.includes(group.label) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </>
                  )}
                </button>
                {!sidebarCollapsed && expandedGroups.includes(group.label) && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {group.children?.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive(child.path)
                            ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-400'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        }`}
                      >
                        <span className="flex-shrink-0">{child.icon}</span>
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-700/50 p-3">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
              李
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate">李晓芳</p>
              <p className="text-[10px] text-gray-500">高级直销经理</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
