import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Search, ShieldCheck, Store, FileText, BookOpen, BarChart3, Sprout, Truck, Factory } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { path: '/', label: '溯源首页', icon: ShieldCheck },
  { path: '/trace', label: '溯源查询', icon: Search },
  { path: '/farm', label: '种植档案', icon: Sprout },
  { path: '/process', label: '加工管理', icon: Factory },
  { path: '/logistics', label: '物流追踪', icon: Truck },
  { path: '/market', label: '交易市场', icon: Store },
  { path: '/shop', label: '店铺管理', icon: Store },
  { path: '/contract', label: '电子合同', icon: FileText },
  { path: '/knowledge', label: '农技知识库', icon: BookOpen },
  { path: '/supervision', label: '监管看板', icon: BarChart3 },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-sm border-b border-primary-100 shadow-sm">
        <div className="h-full flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex items-center gap-2 ml-2 lg:ml-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-lg font-bold text-primary-800 leading-tight">农链通</h1>
              <p className="text-[10px] text-earth-400 leading-tight -mt-0.5">可信溯源 · 交易协同</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-primary-50/50 hover:text-primary-600'
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              区块链网络运行中
            </div>
            <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center text-gold-700 font-serif font-bold text-sm">
              管
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-16 left-0 bottom-0 w-[280px] bg-white z-40 lg:hidden shadow-xl overflow-y-auto scrollbar-thin"
            >
              <nav className="py-4 px-3 space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-primary-50/50'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mt-16 flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="bg-earth-500 text-earth-50 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-earth-200">© 2026 农链通 — 农产品全链条可信溯源与交易协同平台</p>
          <div className="flex items-center gap-4 text-earth-300">
            <span>农业农村部监管对接</span>
            <span>·</span>
            <span>市场监管总局数据接入</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
