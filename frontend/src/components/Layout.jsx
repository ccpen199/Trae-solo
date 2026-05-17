import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Heart, User, Music2 } from 'lucide-react'
import useStore from '../store/useStore'
import MiniPlayer from './MiniPlayer'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentSong } = useStore()

  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: Search, label: '搜索', path: '/search' },
    { icon: Heart, label: '我的', path: '/my-likes' },
  ]

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Music2 className="w-8 h-8 text-primary-400" />
            <span className="text-xl font-bold text-gradient">音乐推荐</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {currentSong && <MiniPlayer />}

      <nav className="fixed bottom-0 left-0 right-0 glass-dark z-40">
        <div className="flex justify-around items-center py-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'text-primary-400 bg-primary-400/10' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default Layout