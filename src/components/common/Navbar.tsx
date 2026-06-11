import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, LayoutGrid, ClipboardList, User, Briefcase, ShieldCheck, ChevronDown, ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import type { UserRole } from '@/types'

const NAV_CONFIG: Record<UserRole, { links: { to: string; label: string; icon: React.ReactNode }[]; bgClass: string }> = {
  worker: {
    bgClass: 'bg-gradient-to-r from-primary-400 to-primary-500',
    links: [
      { to: '/', label: '首页', icon: <Home size={16} /> },
      { to: '/tasks', label: '任务大厅', icon: <LayoutGrid size={16} /> },
      { to: '/my-tasks', label: '我的任务', icon: <ClipboardList size={16} /> },
      { to: '/profile', label: '个人中心', icon: <User size={16} /> },
    ],
  },
  employer: {
    bgClass: 'bg-gradient-to-r from-teal-500 to-teal-600',
    links: [
      { to: '/employer', label: '工作台', icon: <Briefcase size={16} /> },
      { to: '/employer/certify', label: '企业认证', icon: <ShieldCheck size={16} /> },
    ],
  },
  admin: {
    bgClass: 'bg-gradient-to-r from-zinc-700 to-zinc-800',
    links: [
      { to: '/admin', label: '合规审核', icon: <ShieldAlert size={16} /> },
      { to: '/admin/risk', label: '风控看板', icon: <AlertTriangle size={16} /> },
      { to: '/admin/prediction', label: '热度预测', icon: <TrendingUp size={16} /> },
    ],
  },
}

const ROLE_LABELS: Record<UserRole, string> = {
  worker: '接单者',
  employer: '发包方',
  admin: '管理员',
}

const ROLE_HOME: Record<UserRole, string> = {
  worker: '/',
  employer: '/employer',
  admin: '/admin',
}

export default function Navbar() {
  const { currentRole, setCurrentRole } = useStore()
  const config = NAV_CONFIG[currentRole]
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roles: UserRole[] = ['worker', 'employer', 'admin']

  return (
    <nav className={cn('sticky top-0 z-50 text-white shadow-md', config.bgClass)}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="font-serif text-lg font-bold tracking-wide">
          灵活用工
        </Link>

        <div className="flex items-center gap-1">
          {config.links.map((link) => {
            const active = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-white/20' : 'hover:bg-white/10',
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            {ROLE_LABELS[currentRole]}
            <ChevronDown
              size={14}
              className={cn('transition-transform', dropdownOpen && 'rotate-180')}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 rounded-lg bg-white py-1 shadow-lg ring-1 ring-zinc-200">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setCurrentRole(role)
                    setDropdownOpen(false)
                    navigate(ROLE_HOME[role])
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors',
                    role === currentRole
                      ? 'bg-primary-50 text-primary-500 font-medium'
                      : 'text-zinc-600 hover:bg-zinc-50',
                  )}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
