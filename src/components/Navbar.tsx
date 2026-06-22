import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Triangle, Menu, X, PenSquare, User, Shield } from 'lucide-react'
import { useStore } from '@/store'
import TownshipSelector from './TownshipSelector'

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/category', label: '分类' },
  { to: '/news', label: '资讯' },
  { to: '/search', label: '搜索' },
  { to: '/services', label: '服务' },
  { to: '/dashboard', label: '数据看板' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useStore((s) => s.user)

  return (
    <header className="fixed top-0 inset-x-0 h-16 bg-white shadow-sm z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Triangle className="w-6 h-6 text-jade-600 fill-jade-600" />
          <span className="font-serif font-bold text-xl text-jade-700">镇雄本地通</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-5 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'text-jade-600 border-jade-500'
                    : 'text-rock-600 border-transparent hover:text-jade-600 hover:border-jade-300'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <TownshipSelector />
          </div>

          <Link
            to="/admin/overview"
            className="hidden md:flex items-center gap-1.5 bg-rock-800 hover:bg-rock-900 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            运营管理
          </Link>
          <Link
            to="/publish"
            className="hidden md:flex items-center gap-1.5 bg-ember-400 hover:bg-ember-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            发布
          </Link>

          <Link to="/profile" className="hidden md:block">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-jade-100 flex items-center justify-center">
                <User className="w-4 h-4 text-jade-600" />
              </div>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-rock-600 hover:text-rock-900"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-rock-100 shadow-lg">
          <div className="px-4 py-2 border-b border-rock-50">
            <TownshipSelector />
          </div>
          <nav className="flex flex-col py-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'text-jade-600 bg-jade-50' : 'text-rock-600 hover:bg-rock-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/admin/overview"
              onClick={() => setMobileOpen(false)}
              className="mx-4 mt-2 flex items-center justify-center gap-1.5 bg-rock-800 hover:bg-rock-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Shield className="w-4 h-4" />
              运营管理后台
            </Link>
            <Link
              to="/publish"
              onClick={() => setMobileOpen(false)}
              className="mx-4 mt-2 mb-2 flex items-center justify-center gap-1.5 bg-ember-400 hover:bg-ember-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              发布信息
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
