import { Link, useLocation } from 'react-router-dom'
import {
  FileText,
  Home,
  Briefcase,
  Building2,
  Heart,
  GraduationCap,
  Bus,
  TreePine,
  Hospital,
  Wallet,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const sidebarSections = [
  {
    title: '政务办事',
    items: [
      { label: '社保查询', path: '/government/s001', icon: ShieldCheck },
      { label: '公积金提取', path: '/government/s002', icon: Home },
      { label: '户籍登记', path: '/government/s003', icon: FileText },
      { label: '社保卡申领', path: '/government/s004', icon: Briefcase },
    ],
  },
  {
    title: '城市服务',
    items: [
      { label: '扫码乘车', path: '/city-service/transport', icon: Bus },
      { label: '景点预约', path: '/city-service/scenic', icon: TreePine },
      { label: '医院挂号', path: '/city-service/hospital', icon: Hospital },
      { label: '教育缴费', path: '/city-service/education', icon: Wallet },
    ],
  },
  {
    title: '公共服务',
    items: [
      { label: '政策解读', path: '/public-service', icon: GraduationCap },
      { label: '社区公告', path: '/public-service', icon: Building2 },
      { label: '应急广播', path: '/public-service', icon: Heart },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useStore()

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-60 bg-white shadow-lg transition-transform duration-300 overflow-y-auto scrollbar-hide',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-primary-500">导航菜单</span>
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <nav className="px-3 py-4">
          {sidebarSections.map((section) => (
            <div key={section.title} className="mb-5">
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => {
                          if (sidebarOpen) toggleSidebar()
                        }}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200',
                          active
                            ? 'bg-primary-50 text-primary-600 font-medium border-l-3 border-gold-400'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-gold-500' : 'text-gray-400')} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
