import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { User, ChevronDown, Landmark } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/personal', label: '个人服务' },
  { path: '/enterprise', label: '企业服务' },
  { path: '/admin', label: '后台管理' },
]

const roles = [
  { key: 'personal' as const, label: '个人用户' },
  { key: 'enterprise' as const, label: '企业用户' },
  { key: 'admin' as const, label: '管理员' },
]

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentRole, setCurrentRole } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleRoleSwitch(role: 'personal' | 'enterprise' | 'admin') {
    setDropdownOpen(false)
    navigate(`/login?role=${role}`)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-gov-gradient shadow-gov-lg">
      <div className="flex h-full items-center px-6">
        <div className="flex items-center gap-3 mr-10 shrink-0">
          <Landmark className="w-7 h-7 text-gov-gold" />
          <span className="text-white font-serif text-lg font-semibold tracking-wide whitespace-nowrap">
            省级人社一体化政务服务平台
          </span>
        </div>

        <div className="flex items-center gap-1 flex-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
                  isActive ? 'text-gov-gold' : 'text-white/80 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-gov-gold rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gov-gold/20 flex items-center justify-center">
              <User className="w-4 h-4 text-gov-gold" />
            </div>
            <span className="text-white text-sm font-medium">张明</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-white/60 transition-transform duration-200',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-gov-lg border border-gov-border overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-gov-border">
                  <p className="text-xs text-gov-text-secondary">切换角色</p>
                </div>
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => handleRoleSwitch(role.key)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors duration-150',
                      currentRole === role.key
                        ? 'bg-gov-blue/5 text-gov-blue font-medium'
                        : 'text-gov-text hover:bg-gov-bg-light'
                    )}
                  >
                    {role.label}
                    {currentRole === role.key && (
                      <span className="ml-2 text-gov-gold text-xs">●</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  )
}
