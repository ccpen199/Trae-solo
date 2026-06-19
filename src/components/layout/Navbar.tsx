import * as React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Compass,
  BookOpen,
  Briefcase,
  User,
  LogIn,
  ChevronDown,
  LogOut,
  Network,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'
import type { AppRole } from '@/store/useAppStore'

const jobseekerNavItems = [
  { to: '/', label: '首页', icon: Compass, end: true },
  { to: '/jobs', label: '职位', icon: Briefcase },
  { to: '/encyclopedia', label: '职业百科', icon: BookOpen },
  { to: '/diagnosis', label: '能力诊断', icon: Network },
  { to: '/profile', label: '我的主页', icon: User },
]

const hrNavItems = [
  { to: '/', label: '首页', icon: Compass, end: true },
  { to: '/jobs', label: '职位', icon: Briefcase },
  { to: '/hr/talent-pool', label: '人才池', icon: Users },
  { to: '/hr/warnings', label: '预警中心', icon: AlertTriangle },
  { to: '/hr/dashboard', label: '控制台', icon: LayoutDashboard },
]

const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const { user, role, switchRole, logout } = useAppStore()

  const [scrolled, setScrolled] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = role === 'hr' ? hrNavItems : jobseekerNavItems

  const handleRoleSwitch = (newRole: AppRole) => {
    switchRole(newRole)
    if (newRole === 'hr') {
      navigate('/hr/dashboard')
    } else {
      navigate('/')
    }
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 w-full',
        scrolled
          ? 'bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-900/5 border-b border-white/40'
          : 'bg-transparent',
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-space-indigo-500 via-lavender-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-lavender-200/50 group-hover:shadow-xl group-hover:shadow-lavender-300/50 transition-all duration-300 group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-heading font-bold tracking-tight">
            <span className="bg-gradient-to-r from-space-indigo-600 via-lavender-600 to-emerald-600 bg-clip-text text-transparent">
              CareerGraph
            </span>
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                    'transition-all duration-200',
                    isActive
                      ? 'text-space-indigo-700 bg-space-indigo-50/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" />
                    {item.label}
                    <span
                      className={cn(
                        'absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300 ease-out',
                        isActive ? 'w-8 opacity-100' : 'w-0 opacity-0',
                      )}
                    />
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center bg-slate-100/80 rounded-full p-1">
            <button
              onClick={() => handleRoleSwitch('jobseeker')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300',
                role === 'jobseeker'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              求职者
            </button>
            <button
              onClick={() => handleRoleSwitch('hr')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300',
                role === 'hr'
                  ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              HR 控制台
            </button>
          </div>

          {user.isLoggedIn && user.profile ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lavender-400 to-emerald-400 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {getInitial(user.profile.name)}
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-500 transition-transform duration-200',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl shadow-slate-200/60 py-2 overflow-hidden animate-[fade-in-up_0.2s_ease-out]">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user.profile.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{user.profile.email}</p>
                    <div className="mt-2">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        role === 'hr'
                          ? 'bg-space-indigo-100 text-space-indigo-700'
                          : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {role === 'hr' ? 'HR 用户' : '求职者'}
                      </span>
                    </div>
                  </div>

                  {role === 'jobseeker' ? (
                    <>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/profile')
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        我的主页
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/diagnosis')
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Network className="w-4 h-4 text-slate-400" />
                        能力诊断
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        我的收藏
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/hr/dashboard')
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        控制台
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/hr/talent-pool')
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        人才池
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/hr/warnings')
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                        预警中心
                      </button>
                    </>
                  )}

                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              <LogIn className="w-4 h-4" />
              登录
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}

export { Navbar }
