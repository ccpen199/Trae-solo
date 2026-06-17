import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, BarChart3, Crown, Store, ShoppingBag } from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  { label: '首页', path: '/', icon: Home },
  { label: '运营看板', path: '/dashboard', icon: BarChart3 },
  { label: '会员权益', path: '/member', icon: Crown },
  { label: '商户治理', path: '/merchant', icon: Store },
  { label: '消费场景', path: '/scenarios', icon: ShoppingBag },
]

export default function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed)

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-wudu-900 border-r border-wudu-700"
    >
      <div className="flex items-center gap-2 px-5 h-16 shrink-0">
        <span className="w-2 h-2 rounded-full bg-shujin-600 shrink-0" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-serif text-lg text-white tracking-wider"
          >
            川渝联盟
          </motion.span>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-shujin-600 text-white border-l-[3px] border-shujin-400'
                    : 'text-wudu-400 hover:text-white hover:bg-wudu-800'
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-5 pb-4 text-xs text-wudu-500 shrink-0">
          川渝联盟 © 2026
        </div>
      )}
    </motion.aside>
  )
}
