import { Link, useLocation } from 'react-router-dom'
import { Home, Grid3x3, PlusCircle, Heart, User } from 'lucide-react'

const tabs = [
  { to: '/', label: '首页', icon: Home },
  { to: '/category', label: '分类', icon: Grid3x3 },
  { to: '/publish', label: '发布', icon: PlusCircle, publish: true },
  { to: '/services', label: '服务', icon: Heart },
  { to: '/profile', label: '我的', icon: User },
]

export default function MobileTabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-rock-100 shadow-lg z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)
          const Icon = tab.icon

          if (tab.publish) {
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-ember-400 hover:bg-ember-500 flex items-center justify-center shadow-lg shadow-ember-400/30 transition-colors">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] mt-0.5 text-ember-500 font-medium">{tab.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-jade-600' : 'text-rock-400'
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  isActive ? 'text-jade-600 font-medium' : 'text-rock-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
