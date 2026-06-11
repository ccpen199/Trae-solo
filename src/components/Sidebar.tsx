import { PortalMode } from '../types'

interface SidebarProps {
  mode: PortalMode
  collapsed: boolean
  currentPath: string
  onNavigate: (path: string) => void
}

const personalMenu = [
  {
    group: '核心服务',
    items: [
      { key: '/personal', label: '个人门户', icon: '🏠' },
      { key: '/social-security', label: '社保服务', icon: '🛡️' },
      { key: '/employment', label: '就业服务', icon: '💼' },
      { key: '/talent', label: '人才服务', icon: '🎓' },
      { key: '/labor', label: '劳动关系', icon: '⚖️' },
    ]
  },
  {
    group: '智能服务',
    items: [
      { key: '/policy', label: '政策问答', icon: '🤖' },
      { key: '/ocr', label: '材料识别', icon: '📄' },
    ]
  },
  {
    group: '管理中心',
    items: [
      { key: '/monitoring', label: '效能监测', icon: '📊' },
      { key: '/data-integration', label: '数据集成', icon: '🔗' },
    ]
  }
]

const enterpriseMenu = [
  {
    group: '企业服务',
    items: [
      { key: '/enterprise', label: '企业门户', icon: '🏢' },
      { key: '/social-security', label: '社保缴纳', icon: '🛡️' },
      { key: '/labor', label: '劳动关系', icon: '⚖️' },
      { key: '/talent', label: '人才招聘', icon: '🎓' },
    ]
  },
  {
    group: '智能服务',
    items: [
      { key: '/policy', label: '政策问答', icon: '🤖' },
      { key: '/ocr', label: '材料识别', icon: '📄' },
    ]
  },
  {
    group: '管理中心',
    items: [
      { key: '/monitoring', label: '效能监测', icon: '📊' },
      { key: '/data-integration', label: '数据集成', icon: '🔗' },
    ]
  }
]

export default function Sidebar({ mode, collapsed, currentPath, onNavigate }: SidebarProps) {
  const menu = mode === 'personal' ? personalMenu : enterpriseMenu

  return (
    <aside
      className={`fixed left-0 top-[56px] bottom-0 bg-white shadow-lg z-30 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <nav className="h-full overflow-y-auto py-4">
        {menu.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = currentPath === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-3 border-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
