import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Settings2,
  ScanLine,
  FileText,
  ClipboardCheck,
  ShieldAlert,
  Smartphone,
  AlertTriangle,
  GitBranch,
  Building2,
  Banknote,
  FileCheck,
  Users,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeftRight,
  Store,
  User,
  ChevronDown,
  Shield,
} from 'lucide-react'

const adminNavGroups = [
  {
    label: '运营总览',
    items: [
      { to: '/', icon: LayoutDashboard, label: '运营看板' },
    ],
  },
  {
    label: '券活动管理',
    items: [
      { to: '/coupon/list', icon: Ticket, label: '活动列表' },
      { to: '/coupon/create', icon: PlusCircle, label: '创建活动' },
      { to: '/coupon/strategy', icon: Settings2, label: '策略配置' },
    ],
  },
  {
    label: '核销管理',
    items: [
      { to: '/verify/overview', icon: ScanLine, label: '核销概览' },
      { to: '/verify/records', icon: FileText, label: '核销流水' },
      { to: '/verify/reconciliation', icon: ClipboardCheck, label: '核销对账' },
    ],
  },
  {
    label: '风控中心',
    items: [
      { to: '/risk/overview', icon: ShieldAlert, label: '风控概览' },
      { to: '/risk/device-monitor', icon: Smartphone, label: '设备监控' },
      { to: '/risk/hoarding-alert', icon: AlertTriangle, label: '囤券预警' },
      { to: '/risk/path-analysis', icon: GitBranch, label: '路径图谱' },
    ],
  },
  {
    label: '系统配置',
    items: [
      { to: '/system/settlement', icon: Building2, label: '跨市结算' },
      { to: '/system/subsidy', icon: Banknote, label: '财政拨付' },
      { to: '/system/merchant-audit', icon: FileCheck, label: '商户审核' },
    ],
  },
]

const adminPermissions = [
  '券活动全生命周期管理',
  '发放策略配置与审批',
  '风控规则管理',
  '数据看板与报表',
  '财政补贴拨付审批',
  '商户资质审核',
  '跨市结算配置',
]

export default function AdminLayout() {
  const { sidebarCollapsed, toggleSidebar, setCurrentPortal, couponActivities, merchants } = useStore()
  const navigate = useNavigate()
  const [portalOpen, setPortalOpen] = useState(false)

  const switchPortal = (portal: 'admin' | 'merchant' | 'citizen') => {
    setCurrentPortal(portal)
    setPortalOpen(false)
    if (portal === 'merchant') navigate('/merchant')
    else if (portal === 'citizen') navigate('/citizen')
    else navigate('/')
  }

  const activeCount = couponActivities.filter((a) => a.status === 'active').length
  const draftCount = couponActivities.filter((a) => a.status === 'draft').length
  const activeMerchants = merchants.filter((m) => m.status === 'active').length

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside
        className={cn(
          'flex flex-col bg-primary text-white transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className={cn('flex items-center h-16 px-4 border-b border-white/10', sidebarCollapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">惠</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold truncate leading-tight">沈阳惠民平台</h1>
              <p className="text-[10px] text-white/50 truncate">运营管理端</p>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/5">
              <Shield size={12} className="text-accent flex-shrink-0" />
              <span className="text-[10px] text-white/60">超级管理员 · 全局权限</span>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {adminNavGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!sidebarCollapsed && (
                <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-white/30 font-medium">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all duration-200',
                      isActive
                        ? 'bg-accent text-primary font-medium'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                      sidebarCollapsed && 'justify-center px-0 mx-1'
                    )
                  }
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full py-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[#6B7A99]">
              <Users size={16} />
              <span>欢迎回来，管理员</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/5 text-xs text-primary">
              <Shield size={11} />
              <span>运营管理权限</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-[#6B7A99]">
              <span>进行中 <b className="text-primary">{activeCount}</b></span>
              <span>草稿 <b className="text-accent">{draftCount}</b></span>
              <span>商户 <b className="text-primary">{activeMerchants}</b></span>
            </div>
            <div className="relative">
              <button
                onClick={() => setPortalOpen(!portalOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary-50 text-primary hover:bg-primary-100 transition-colors"
              >
                <ArrowLeftRight size={14} />
                <span>切换端</span>
                <ChevronDown size={14} />
              </button>
              {portalOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPortalOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-border py-1 z-50 w-56">
                    <button
                      onClick={() => switchPortal('admin')}
                      className="flex items-start gap-3 w-full px-3 py-2.5 text-sm text-primary bg-primary-50"
                    >
                      <LayoutDashboard size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">运营管理端</div>
                        <div className="text-[10px] text-[#6B7A99]">券活动管理·风控·财政·结算</div>
                      </div>
                    </button>
                    <button
                      onClick={() => switchPortal('merchant')}
                      className="flex items-start gap-3 w-full px-3 py-2.5 text-sm text-[#6B7A99] hover:bg-gray-50"
                    >
                      <Store size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">商户后台</div>
                        <div className="text-[10px] text-[#6B7A99]">核销·对账·库存管理</div>
                      </div>
                    </button>
                    <button
                      onClick={() => switchPortal('citizen')}
                      className="flex items-start gap-3 w-full px-3 py-2.5 text-sm text-[#6B7A99] hover:bg-gray-50"
                    >
                      <User size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">市民端</div>
                        <div className="text-[10px] text-[#6B7A99]">领券·核销·消费记录</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-xs font-bold">管</span>
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
