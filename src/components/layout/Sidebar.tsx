import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calculator,
  Users,
  HardHat,
  Package,
  Scale,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/dashboard', label: '首页总览', icon: LayoutDashboard },
  { path: '/ai-quote', label: 'AI报价中心', icon: Calculator },
  { path: '/designers', label: '设计师图谱', icon: Users },
  { path: '/construction', label: '施工监理', icon: HardHat },
  { path: '/supply-chain', label: '供应链溯源', icon: Package },
  { path: '/dispute', label: '纠纷调解', icon: Scale },
  { path: '/credit', label: '信用中心', icon: ShieldCheck },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-gradient-primary text-white flex flex-col z-40 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">装信通</h1>
              <p className="text-xs text-white/60">家装信用服务平台</p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-gold flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 w-full"
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                    isActive && 'text-gold-400'
                  )}
                />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <span className="text-sm">收起菜单</span>
              <ChevronLeft className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
