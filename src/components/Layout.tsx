import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { PortalMode } from '../types'

export default function Layout() {
  const [mode, setMode] = useState<PortalMode>('personal')
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleModeSwitch = (newMode: PortalMode) => {
    setMode(newMode)
    if (newMode === 'personal') {
      navigate('/personal')
    } else {
      navigate('/enterprise')
    }
  }

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center text-white text-sm font-bold">
              渝
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 leading-tight">重庆市人社数字服务中台</h1>
              <p className="text-[10px] text-gray-400 leading-tight">全业务一体化平台</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => handleModeSwitch('personal')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'personal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👤 个人门户
            </button>
            <button
              onClick={() => handleModeSwitch('enterprise')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'enterprise'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏢 企业门户
            </button>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
              {mode === 'personal' ? '张' : '重'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-gray-700">
                {mode === 'personal' ? '张三' : '重庆XX科技有限公司'}
              </p>
              <p className="text-[10px] text-gray-400">
                {mode === 'personal' ? '身份证: 500***1234' : '统一信用代码: 91500***5678'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <Sidebar
        mode={mode}
        collapsed={collapsed}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
      />

      <main
        className={`pt-14 min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
