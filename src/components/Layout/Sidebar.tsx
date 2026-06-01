import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Search,
  Zap,
  Truck,
  Network,
  Shield,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Mic,
  Upload,
  Route,
  AlertTriangle,
  MapPin,
  FileText,
  Calculator,
  Users,
  CloudRain,
  Eye,
  Key,
  FileCheck,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const menuItems = [
  {
    id: 'dashboard',
    path: '/',
    label: '运营概览',
    icon: LayoutDashboard,
  },
  {
    id: 'ship',
    label: '寄件管理',
    icon: Package,
    children: [
      { path: '/ship', label: '单件下单', icon: Package },
      { path: '/ship/batch', label: '批量导入', icon: Upload },
      { path: '/ship/scan', label: '扫码下单', icon: QrCode },
      { path: '/ship/voice', label: '语音转单', icon: Mic },
      { path: '/ship/routing', label: '智能路由', icon: Route },
    ],
  },
  {
    id: 'track',
    label: '查件系统',
    icon: Search,
    children: [
      { path: '/track', label: '运单列表', icon: Search },
      { path: '/track/exception', label: '异常中心', icon: AlertTriangle },
    ],
  },
  {
    id: 'express',
    label: '同城急送',
    icon: Zap,
    children: [
      { path: '/express', label: '急送下单', icon: Zap },
      { path: '/express/protocol', label: '特殊协议', icon: FileText },
    ],
  },
  {
    id: 'bulk',
    label: '大件物流',
    icon: Truck,
    children: [
      { path: '/bulk', label: '大件下单', icon: Truck },
      { path: '/bulk/providers', label: '服务商目录', icon: Users },
      { path: '/bulk/calculator', label: '费用测算', icon: Calculator },
    ],
  },
  {
    id: 'twin',
    label: '运力孪生',
    icon: Network,
    children: [
      { path: '/twin/network', label: '网点吞吐', icon: Network },
      { path: '/twin/vehicles', label: '车辆热力', icon: MapPin },
      { path: '/twin/weather', label: '天气预测', icon: CloudRain },
    ],
  },
  {
    id: 'security',
    label: '安全合规',
    icon: Shield,
    children: [
      { path: '/security', label: '脱敏管理', icon: Eye },
      { path: '/security/decrypt', label: '解密审批', icon: Key },
      { path: '/security/compliance', label: 'ISO27001', icon: FileCheck },
    ],
  },
]

const Sidebar: React.FC = () => {
  const { sidebarOpen, activeMenu, setActiveMenu, toggleSidebar } = useAppStore()
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>(['ship', 'track'])
  const navigate = useNavigate()

  const toggleMenu = (item: typeof menuItems[0]) => {
    setExpandedMenus(prev =>
      prev.includes(item.id)
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id]
    )
    if (item.children && item.children.length > 0) {
      navigate(item.children[0].path)
      setActiveMenu(item.id)
    }
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-sf-black border-r border-sf-blue/30 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sf-blue/30">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sf-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold font-display text-lg">SF</span>
            </div>
            <span className="text-sf-light font-display text-lg">顺丰物流</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-sf-dark text-sf-light/70 hover:text-sf-light transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    activeMenu === item.id || expandedMenus.includes(item.id)
                      ? 'bg-sf-red/10 text-sf-red'
                      : 'text-sf-light/70 hover:bg-sf-dark hover:text-sf-light'
                  }`}
                >
                  <item.icon size={18} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${
                          expandedMenus.includes(item.id) ? 'rotate-90' : ''
                        }`}
                      />
                    </>
                  )}
                </button>
                {sidebarOpen && expandedMenus.includes(item.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => setActiveMenu(item.id)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-sf-red text-white'
                              : 'text-sf-light/60 hover:bg-sf-dark hover:text-sf-light'
                          }`
                        }
                      >
                        <child.icon size={14} />
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                onClick={() => setActiveMenu(item.id)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-sf-red text-white'
                      : 'text-sf-light/70 hover:bg-sf-dark hover:text-sf-light'
                  }`
                }
              >
                <item.icon size={18} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
