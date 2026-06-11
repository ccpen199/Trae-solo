import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  Store,
  Ticket,
  ScanLine,
  ClipboardCheck,
  TrendingUp,
  ArrowLeftRight,
  LayoutDashboard,
  User,
  Shield,
} from 'lucide-react'

const merchantNavItems = [
  { to: '/merchant', icon: Store, label: '商户总览', end: true },
  { to: '/merchant/coupons', icon: Ticket, label: '券活动管理' },
  { to: '/merchant/verify', icon: ScanLine, label: '核销操作' },
  { to: '/merchant/reconciliation', icon: ClipboardCheck, label: '核销对账' },
  { to: '/merchant/alert', icon: TrendingUp, label: '核销率预警' },
]

const merchantPermissions = [
  '参与券活动核销',
  '库存实时查看',
  '核销对账报表',
  '核销率趋势查看',
]

export default function MerchantLayout() {
  const { setCurrentPortal, merchants } = useStore()
  const navigate = useNavigate()
  const merchant = merchants[0]

  const switchToAdmin = () => {
    setCurrentPortal('admin')
    navigate('/')
  }

  const switchToCitizen = () => {
    setCurrentPortal('citizen')
    navigate('/citizen')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="flex flex-col w-56 bg-white border-r border-border">
        <div className="flex items-center h-16 px-4 gap-3 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">惠</span>
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-primary truncate leading-tight">商户后台</h1>
            <p className="text-[10px] text-[#6B7A99] truncate">{merchant?.name || '商户'}</p>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-border">
          <div className="px-2 py-1.5 rounded-md bg-primary/5">
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Store size={11} />
              <span>{merchant?.category} · {merchant?.district}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#6B7A99]">
              <Shield size={10} />
              <span>商户权限 · 核销/对账/库存</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {merchantNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white font-medium'
                    : 'text-[#6B7A99] hover:bg-gray-100'
                )
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <p className="px-2 mb-2 text-[10px] text-[#6B7A99] font-medium">切换视角</p>
          <button
            onClick={switchToAdmin}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#6B7A99] hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard size={14} />
            <div className="text-left">
              <span className="text-xs">运营管理端</span>
              <p className="text-[10px] text-[#6B7A99]/60">券活动·风控·财政</p>
            </div>
          </button>
          <button
            onClick={switchToCitizen}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#6B7A99] hover:bg-gray-100 transition-colors"
          >
            <User size={14} />
            <div className="text-left">
              <span className="text-xs">市民端</span>
              <p className="text-[10px] text-[#6B7A99]/60">领券·核销·消费</p>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-primary">商户管理后台</h2>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent/10 text-xs text-accent-dark">
              <Store size={11} />
              <span>商户权限</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#6B7A99]">
              核销率 <b className="text-primary">{(merchant?.verifyRate ?? 0) * 100}%</b>
              <span className="mx-1.5">·</span>
              核销 <b className="text-primary">{merchant?.verifyCount ?? 0}</b> 笔
            </div>
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <Store size={12} className="text-accent-dark" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
