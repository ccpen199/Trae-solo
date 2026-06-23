import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, User } from 'lucide-react'
import useStore from '@/stores/useStore'

export default function Navbar() {
  const { user } = useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl font-bold text-honghe-red tracking-wide">
          红河生活
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索资讯、圈子、商品..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-warm-50 border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-honghe-red/30 focus:border-honghe-red transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-warm-600 hover:text-honghe-red transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-5 h-5" />
          </button>
          <Link to="/news" className="relative p-2 text-warm-600 hover:text-honghe-red transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-honghe-red rounded-full" />
          </Link>
          {user ? (
            <Link to="/profile" className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-honghe-red/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-honghe-red" />
                </div>
              )}
            </Link>
          ) : (
            <Link to="/profile" className="btn-primary text-sm !px-4 !py-1.5">
              登录
            </Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索资讯、圈子、商品..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-warm-50 border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-honghe-red/30"
              autoFocus
            />
          </div>
        </div>
      )}

      <div className="ethnic-border" />
    </nav>
  )
}
