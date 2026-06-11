import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  Home,
  Compass,
  Wallet,
  Clock,
  Store,
  LayoutDashboard,
  Shield,
  User,
} from 'lucide-react'

const citizenNavItems = [
  { to: '/citizen', icon: Home, label: '首页', end: true },
  { to: '/citizen/explore', icon: Compass, label: '领券中心' },
  { to: '/citizen/wallet', icon: Wallet, label: '我的券包' },
  { to: '/citizen/history', icon: Clock, label: '消费记录' },
]

export default function CitizenLayout() {
  const { setCurrentPortal, citizenCoupons } = useStore()
  const navigate = useNavigate()
  const unusedCount = citizenCoupons.filter((c) => c.status === 'unused').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary-light to-primary">
      <header className="bg-primary text-white">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-primary font-bold text-sm">惠</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">沈阳惠民服务</h1>
              <p className="text-[10px] text-white/50">市民端 · 领券·核销·消费</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/70">
              <User size={10} />
              <span>市民权限</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 text-[10px] text-accent-light">
              <Wallet size={10} />
              <span>{unusedCount}张可用</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCurrentPortal('admin'); navigate('/') }}
                className="text-[10px] text-white/40 hover:text-white/80 transition-colors flex items-center gap-0.5"
              >
                <LayoutDashboard size={10} />
                管理端
              </button>
              <button
                onClick={() => { setCurrentPortal('merchant'); navigate('/merchant') }}
                className="text-[10px] text-white/40 hover:text-white/80 transition-colors flex items-center gap-0.5"
              >
                <Store size={10} />
                商户端
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
        <div className="max-w-lg mx-auto flex">
          {citizenNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                  isActive
                    ? 'text-accent font-medium'
                    : 'text-[#6B7A99]'
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
