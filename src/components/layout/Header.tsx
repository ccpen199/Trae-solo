import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, LogIn, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navItems = [
  { label: '首页', href: '/' },
  { label: '起名', href: '/naming' },
  { label: '案例库', href: '/cases' },
  { label: '命名师', href: '/masters' },
]

export const Header: React.FC = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-ink-50/90 backdrop-blur-sm border-b border-ink-200">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="seal-stamp w-10 h-10 -rotate-3">
            <span className="font-serif text-sm font-bold">雅</span>
          </div>
          <span className="font-serif text-2xl font-bold tracking-wider ink-text-gradient">
            雅名轩
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-cinnabar-700' : 'text-ink-600 hover:text-jade-700'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cinnabar-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
            登录
          </Button>
          <Button variant="primary" size="sm" leftIcon={<User className="h-4 w-4" />}>
            注册
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-ink-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-ink-200 bg-ink-50">
          <div className="container py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cinnabar-50 text-cinnabar-700'
                      : 'text-ink-600 hover:bg-jade-50 hover:text-jade-700'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="pt-3 space-y-2">
              <Button variant="ghost" size="sm" fullWidth leftIcon={<LogIn className="h-4 w-4" />}>
                登录
              </Button>
              <Button variant="primary" size="sm" fullWidth leftIcon={<User className="h-4 w-4" />}>
                注册
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
Header.displayName = 'Header'
