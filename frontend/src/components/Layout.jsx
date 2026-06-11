import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/', name: '总览', icon: '📊', group: 'main' },
  { path: '/devices', name: '我的设备', icon: '🛴', group: 'main' },
  { path: '/rides', name: '骑行记录', icon: '📍', group: 'main' },
  { path: '/fences', name: '电子围栏', icon: '🚧', group: 'main' },
  { path: '/social', name: '社区广场', icon: '👥', group: 'social' },
  { path: '/clubs', name: '俱乐部', icon: '🏆', group: 'social' },
  { path: '/events', name: '赛事活动', icon: '🎯', group: 'social' },
  { path: '/topics', name: '话题广场', icon: '💬', group: 'social' },
  { path: '/service', name: '服务支持', icon: '🔧', group: 'service' },
  { path: '/service-orders', name: '我的工单', icon: '📋', group: 'service' },
  { path: '/shop', name: '商城', icon: '🛒', group: 'shop' },
  { path: '/orders', name: '我的订单', icon: '📦', group: 'shop' },
  { path: '/privacy', name: '隐私中心', icon: '🔒', group: 'settings' },
]

export default function Layout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const groups = {
    main: '核心功能',
    social: '社交互动',
    service: '服务支持',
    shop: '商城购物',
    settings: '设置'
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-primary-600">智行管家</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="mb-4">
              {sidebarOpen && (
                <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {groups[group]}
                </div>
              )}
              {items.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title={item.name}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="ml-3">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          ))}

          {user?.role === 'admin' && (
            <div className="mb-4">
              {sidebarOpen && (
                <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  管理后台
                </div>
              )}
              <Link
                to="/admin"
                className={`flex items-center px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-red-50 text-red-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">⚙️</span>
                {sidebarOpen && <span className="ml-3">管理后台</span>}
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
              {user?.nickname?.[0] || user?.username?.[0] || 'U'}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {user?.nickname || user?.username}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.n_coins} N币
                </div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={onLogout}
              className="mt-3 w-full text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              退出登录
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find(m => m.path === location.pathname)?.name || '智行管家'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
