import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Music, Theater, Mic, LayoutGrid, MapPin, Calendar, LogOut, Menu, X } from 'lucide-react'
import useEventStore from '@/stores/eventStore'
import useAuthStore from '@/stores/authStore'

const categoryConfig: Record<string, { label: string; icon: any; gradient: string }> = {
  concert: { label: '演唱会', icon: Music, gradient: 'from-wine-700 to-wine-950' },
  drama: { label: '话剧', icon: Theater, gradient: 'from-purple-700 to-wine-950' },
  talkshow: { label: '脱口秀', icon: Mic, gradient: 'from-amber-700 to-wine-950' },
  other: { label: '更多', icon: LayoutGrid, gradient: 'from-teal-700 to-wine-950' },
}

export default function Home() {
  const { events, fetchEvents, loading } = useEventStore()
  const { user, isLoggedIn, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    fetchEvents({ category: activeCategory || undefined })
  }, [activeCategory, fetchEvents])

  useEffect(() => {
    if (events.length >= 3) {
      timerRef.current = window.setInterval(() => {
        setSlideIndex((i) => (i + 1) % 3)
      }, 5000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [events])

  const slides = events.slice(0, 3)
  const currentSlide = slides[slideIndex] || events[0]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gold-400 font-medium">首页</Link>
            <Link to="/orders" className="text-carbon-300 hover:text-white transition">订单中心</Link>
            <Link to="/organizer" className="text-carbon-300 hover:text-white transition">主办方</Link>
            <Link to="/admin" className="text-carbon-300 hover:text-white transition">运营</Link>
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-gold-400">{user?.realName}</span>
                <button onClick={handleLogout} className="text-carbon-400 hover:text-white transition flex items-center gap-1">
                  <LogOut size={18} />
                  退出
                </button>
              </div>
            ) : (
              <Link to="/login" className="wine-gradient-btn text-sm">登录</Link>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 border-t border-carbon-700/50 flex flex-col gap-3">
            <Link to="/" className="text-gold-400 py-2">首页</Link>
            <Link to="/orders" className="text-carbon-300 py-2">订单中心</Link>
            <Link to="/organizer" className="text-carbon-300 py-2">主办方</Link>
            <Link to="/admin" className="text-carbon-300 py-2">运营</Link>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="text-left text-carbon-300 py-2">退出登录</button>
            ) : (
              <Link to="/login" className="text-gold-400 py-2">登录 / 注册</Link>
            )}
          </div>
        )}
      </nav>

      <div className="container mx-auto px-6 py-8">
        {slides.length > 0 && currentSlide && (
          <div className="relative h-96 rounded-2xl overflow-hidden mb-12 shadow-glass">
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryConfig[currentSlide.category]?.gradient || 'from-wine-700 to-wine-950'}`}>
              <div className="absolute right-20 top-1/2 -translate-y-1/2 opacity-20">
                {categoryConfig[currentSlide.category]?.icon && 
                  (() => { const Icon = categoryConfig[currentSlide.category].icon; return <Icon size={280} /> })()}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="pl-12 max-w-2xl">
                <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-gold-300 text-sm mb-4">
                  {categoryConfig[currentSlide.category]?.label || '演出'}
                </span>
                <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">{currentSlide.title}</h1>
                <div className="flex items-center gap-4 text-white/80 mb-3">
                  <MapPin size={18} />
                  <span>{currentSlide.venue}</span>
                </div>
                <div className="flex items-center gap-4 text-white/80 mb-8">
                  <Calendar size={18} />
                  <span>多场次可选</span>
                </div>
                <Link to={`/event/${currentSlide.id}`} className="gold-gradient-btn inline-block">
                  立即抢票
                </Link>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-carbon-700/50">
              <div
                className="h-full bg-gradient-gold transition-all duration-1000 ease-linear"
                style={{ width: `${((slideIndex + 1) / slides.length) * 100}%` }}
              />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${i === slideIndex ? 'bg-gold-500 w-6' : 'bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-12">
          <h2 className="section-title">演出分类</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(categoryConfig).map(([key, cfg]) => {
              const Icon = cfg.icon
              const isActive = activeCategory === key
              return (
                <div
                  key={key}
                  onClick={() => setActiveCategory(isActive ? null : key)}
                  className={`glass-card p-8 cursor-pointer card-hover text-center transition-all ${
                    isActive ? 'border-2 border-gold-500 shadow-glow-wine' : ''
                  }`}
                >
                  <div className="mb-4">
                    <Icon size={48} className="mx-auto text-gold-400" />
                  </div>
                  <div className="text-xl font-medium text-white">{cfg.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="section-title">热门演出</h2>
          {loading ? (
            <div className="text-center text-carbon-400 py-12">加载中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => {
                const cfg = categoryConfig[event.category] || categoryConfig.other
                const Icon = cfg.icon
                return (
                  <Link
                    key={event.id}
                    to={`/event/${event.id}`}
                    className="glass-card overflow-hidden card-hover animate-slide-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className={`h-52 bg-gradient-to-br ${cfg.gradient} flex items-center justify-center relative`}>
                      <Icon size={80} className="text-white/25" />
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/30 text-gold-300 text-xs backdrop-blur-sm">
                        {cfg.label}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 h-14">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-carbon-400 mb-3">
                        <MapPin size={14} />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-display text-2xl text-gold-500">¥280起</span>
                        <span className="text-sm text-carbon-400">剩余席位紧张</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-carbon-700/50 py-8 mt-12">
        <div className="container mx-auto px-6 text-center text-carbon-500 text-sm">
          <p className="font-display text-gold-500/50 text-lg mb-2">TICKET VAULT</p>
          <p>© 2026 Ticket Vault. 高并发演出票务交易与履约保障平台</p>
          <p className="mt-1 text-xs">每张票都绑定唯一防伪码 + 区块链存证</p>
        </div>
      </footer>
    </div>
  )
}
