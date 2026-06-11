import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/profile', label: '匿名建档' },
  { to: '/vent', label: '倾诉初筛' },
  { to: '/match', label: '咨询师匹配' },
  { to: '/dashboard', label: '个人中心' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans text-slate-dark">
      <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-lavender-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-lavender-600">心屿</span>
            <span className="text-xs text-lavender-400 hidden sm:inline">MindIsland</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-lavender-100 text-lavender-700'
                      : 'text-slate-dark-500 hover:text-lavender-600 hover:bg-lavender-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-lavender-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-cream/95 backdrop-blur-md border-b border-lavender-100"
          >
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-lavender-100 text-lavender-700'
                        : 'text-slate-dark-500 hover:text-lavender-600 hover:bg-lavender-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-lavender-100 bg-cream py-8">
        <div className="container mx-auto px-4 text-center text-xs text-slate-dark-400 space-y-2">
          <p className="font-serif text-sm text-lavender-500">心屿 — 你的心事，有处安放</p>
          <p>本平台仅提供心理健康辅助服务，不替代专业医疗诊断与治疗</p>
          <p>您的所有信息严格遵守《个人信息保护法》，全程加密存储</p>
          <p className="text-slate-dark-300">© 2025 心屿 MindIsland</p>
        </div>
      </footer>
    </div>
  );
}
