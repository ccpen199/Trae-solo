import React, { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { 
  Calendar, 
  Building2, 
  UtensilsCrossed, 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Menu, 
  X,
  Hotel
} from 'lucide-react'

const menuItems = [
  { path: '/', label: '首页预订', icon: Calendar },
  { path: '/halls', label: '宴会厅管理', icon: Building2 },
  { path: '/bookings', label: '档期管理', icon: Calendar },
  { path: '/sales', label: '销售方案', icon: UtensilsCrossed },
  { path: '/contracts', label: '合同定金', icon: FileText },
  { path: '/execution', label: '执行单', icon: ClipboardList },
  { path: '/reports', label: '报表验收', icon: BarChart3 },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Hotel className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-lg text-gray-800">宴会预订</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="text-xl font-semibold text-gray-800">
            {menuItems.find(m => location.pathname === m.path || 
              (m.path !== '/' && location.pathname.startsWith(m.path)))?.label || '宴会预订系统'}
          </h1>
        </header>
        
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
