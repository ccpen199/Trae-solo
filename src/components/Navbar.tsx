import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Shield, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import GeoLocationSelector from './GeoLocationSelector'

export default function Navbar() {
  const { setVoiceSearchOpen, sidebarOpen, setSidebarOpen } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: '首页', to: '/' },
    { label: '信息发布', to: '/publish' },
    { label: '商家认证', to: '/merchant' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-navy-800 text-white h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">
        <Link to="/" className="font-serif font-bold text-lg whitespace-nowrap">
          分类信息公共服务平台
        </Link>

        <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
          <GeoLocationSelector />
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="搜索分类信息..."
              className="w-full bg-navy-700 text-white text-sm rounded-full pl-4 pr-10 py-2 border border-navy-600 focus:outline-none focus:ring-2 focus:ring-accent-400 placeholder:text-navy-300"
            />
            <button
              onClick={() => setVoiceSearchOpen(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-navy-600 transition-colors"
            >
              <Mic className="w-4 h-4 text-accent-400" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-navy-200 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/admin"
            className={cn(
              'flex items-center gap-1 text-sm text-navy-200 hover:text-white transition-colors'
            )}
          >
            <Shield className="w-4 h-4" />
            管理后台
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-900 border-t border-navy-700 px-4 py-3 animate-slide-up">
          <div className="mb-3">
            <GeoLocationSelector />
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="搜索分类信息..."
              className="w-full bg-navy-700 text-white text-sm rounded-full pl-4 pr-10 py-2 border border-navy-600 focus:outline-none focus:ring-2 focus:ring-accent-400 placeholder:text-navy-300"
            />
            <button
              onClick={() => setVoiceSearchOpen(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-navy-600 transition-colors"
            >
              <Mic className="w-4 h-4 text-accent-400" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-navy-200 hover:text-white py-1.5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="flex items-center gap-1 text-sm text-navy-200 hover:text-white py-1.5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield className="w-4 h-4" />
              管理后台
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
