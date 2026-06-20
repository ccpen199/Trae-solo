import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search, User, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: '首页', to: '/' },
  { label: '案例库', to: '/cases' },
  { label: '找设计师', to: '/designers' },
  { label: '成本计算器', to: '/calculator' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`glass fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="mx-auto flex max-w-8xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-2xl font-bold text-sand-900">
            筑居
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-sand-900/70 transition-colors hover:text-sand-400"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden text-sand-900/70 transition-colors hover:text-sand-400 sm:block">
              <Search size={20} />
            </button>
            <Link
              to="/favorites"
              className="hidden text-sand-900/70 transition-colors hover:text-sand-400 sm:block"
            >
              <Heart size={20} />
            </Link>
            <Link
              to="/profile"
              className="hidden text-sand-900/70 transition-colors hover:text-sand-400 sm:block"
            >
              <User size={20} />
            </Link>
            <button
              className="text-sand-900/70 transition-colors hover:text-sand-400 md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 transform bg-sand-100 shadow-xl transition-transform duration-300 md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
          <span className="font-display text-xl font-bold text-sand-900">筑居</span>
          <button onClick={() => setDrawerOpen(false)} className="text-sand-900/70">
            <X size={22} />
          </button>
        </div>
        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-sand-900/80 transition-colors hover:bg-sand-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/favorites"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sand-900/80 transition-colors hover:bg-sand-200"
          >
            <Heart size={16} /> 收藏
          </Link>
          <Link
            to="/profile"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sand-900/80 transition-colors hover:bg-sand-200"
          >
            <User size={16} /> 个人中心
          </Link>
        </div>
      </div>
    </>
  )
}
