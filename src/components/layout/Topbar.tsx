import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Question,
  MagnifyingGlass,
  CaretDown,
  SignOut,
  User,
  CaretRight,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

const pageNameMap: Record<string, string> = {
  dashboard: '仪表盘',
  holder: '持券人中心',
  market: '权益兑换',
  contract: '智能合约',
  partner: '合作方',
  merchant: '商户管理',
  blockchain: '区块链存证',
  health: '权益监控',
  'ar-fence': 'AR地理围栏',
  verify: '核销中心',
};

export default function Topbar() {
  const location = useLocation();
  const { sidebarCollapsed } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentPage = location.pathname.split('/')[1] || 'dashboard';
  const currentPageName = pageNameMap[currentPage] || '仪表盘';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        'fixed top-0 right-0 z-30 h-16 glass-card border-b border-gold-400/15 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        sidebarCollapsed ? 'left-[76px]' : 'left-[248px]'
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">控制台</span>
          <CaretRight size={14} className="text-gray-500" />
          <span className="font-medium text-gold-100">{currentPageName}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜索菜单、持券人、合约..."
              className="input-field w-72 pl-10 pr-4 py-2 text-sm"
            />
          </div>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-space-800/60 border border-gold-400/15 text-gray-300 hover:text-gold-200 hover:border-gold-400/35 transition-all">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-risk px-1 text-[10px] font-bold text-white border-2 border-space-900">
              9
            </span>
          </button>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-space-800/60 border border-gold-400/15 text-gray-300 hover:text-gold-200 hover:border-gold-400/35 transition-all">
            <Question size={18} />
          </button>

          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 rounded-xl bg-space-800/60 border border-gold-400/15 px-3 py-1.5 hover:border-gold-400/35 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-300/30 to-gold-500/10 text-gold-300 text-xs font-bold border border-gold-400/25">
                QL
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gold-100 leading-tight">权益链管理员</div>
                <div className="text-[10px] text-gray-400 leading-tight">超级管理员</div>
              </div>
              <CaretDown size={14} className={cn('text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-2 w-56 glass-card border border-gold-400/20 overflow-hidden"
                >
                  <div className="p-4 border-b border-gold-400/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300/30 to-gold-500/10 text-gold-300 text-sm font-bold border border-gold-400/25">
                        QL
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gold-100">权益链管理员</div>
                        <div className="text-xs text-gray-400">超级管理员</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-space-800/80 hover:text-gold-200 transition-colors">
                      <User size={16} />
                      个人中心
                    </button>
                    <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-risk hover:bg-risk/10 transition-colors">
                      <SignOut size={16} />
                      退出登录
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
