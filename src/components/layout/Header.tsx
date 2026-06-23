import { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, Building2, ChevronDown, Shield, Truck, Package } from 'lucide-react'
import { useAppStore } from '../../store/app'
import type { UserRole } from '../../types'
import { cn } from '../../utils'

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  shipper: { label: '货主企业', icon: Package, color: 'text-blue-400 bg-blue-500/15' },
  carrier: { label: '承运方', icon: Truck, color: 'text-cyan-400 bg-cyan-500/15' },
  operator: { label: '平台运营', icon: Shield, color: 'text-amber-400 bg-amber-500/15' },
}

export function Header() {
  const { currentRole, currentUser, setCurrentRole } = useAppStore()
  const [roleOpen, setRoleOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const role = roleConfig[currentRole]
  const RoleIcon = role.icon

  return (
    <header className="flex h-16 items-center justify-between border-b border-logistics-border bg-logistics-panel px-6">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-logistics-muted" />
          <input
            className="h-9 w-72 rounded-lg border border-logistics-border bg-logistics-bg pl-9 pr-3 text-sm placeholder-logistics-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="搜索订单号、车牌号、企业..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setRoleOpen((v) => !v)}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border border-logistics-border bg-logistics-bg px-3 text-sm transition-colors hover:border-primary-500/50'
            )}
          >
            <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', role.color)}>
              <RoleIcon className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-logistics-text">{role.label}</span>
            <ChevronDown className="h-4 w-4 text-logistics-muted" />
          </button>
          {roleOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-logistics-border bg-logistics-panel py-1 shadow-2xl">
              {(Object.keys(roleConfig) as UserRole[]).map((r) => {
                const cfg = roleConfig[r]
                const Icon = cfg.icon
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setCurrentRole(r)
                      setRoleOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                      currentRole === r
                        ? 'bg-primary-600/10 text-primary-400'
                        : 'text-logistics-muted hover:bg-logistics-border/40 hover:text-logistics-text'
                    )}
                  >
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', cfg.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-logistics-border bg-logistics-bg text-logistics-muted transition-colors hover:text-logistics-text">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-logistics-border/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden text-left md:block">
              <div className="text-sm font-medium text-logistics-text">{currentUser.name}</div>
              <div className="flex items-center gap-1 text-[11px] text-logistics-muted">
                <Building2 className="h-3 w-3" />
                <span className="truncate max-w-[160px]">{currentUser.company}</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-logistics-muted" />
          </button>
          {userOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-logistics-border bg-logistics-panel py-1 shadow-2xl">
              <div className="border-b border-logistics-border px-3 py-3">
                <div className="text-sm font-medium text-logistics-text">{currentUser.name}</div>
                <div className="text-xs text-logistics-muted">{currentUser.company}</div>
              </div>
              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-logistics-muted transition-colors hover:bg-logistics-border/40 hover:text-logistics-text">
                个人中心
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-logistics-muted transition-colors hover:bg-logistics-border/40 hover:text-logistics-text">
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
