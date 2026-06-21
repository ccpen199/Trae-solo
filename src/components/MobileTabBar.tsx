import { NavLink } from 'react-router-dom'
import { Home, Grid3x3, ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: TabItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/transport', label: '服务', icon: Grid3x3 },
  { path: '/tracking', label: '办理', icon: ClipboardList },
  { path: '/profile', label: '我的', icon: User },
]

export default function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40">
      <div className="h-full grid grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-6 h-6', isActive ? 'text-blue-600' : 'text-gray-400')} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
