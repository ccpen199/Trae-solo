import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import RoleSwitcher from '@/components/layout/RoleSwitcher';
import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';
import Toast from '@/components/ui/Toast';
import { cn } from '@/utils';

const AppLayout: React.FC = () => {
  const currentRole = useAppStore(s => s.currentRole);
  const isSidebarOpen = useAppStore(s => s.isSidebarOpen);

  const isBackend = currentRole === 'dispatcher' || currentRole === 'finance';
  const isMobileFrontend = currentRole === 'user' || currentRole === 'rider';

  return (
    <div className={cn(
      'min-h-screen w-full flex flex-col',
      isBackend ? 'bg-[#0F1629] text-white' : 'bg-slate-50 text-slate-900'
    )}>
      {isBackend && (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div
            className={cn(
              'flex-1 flex flex-col overflow-hidden transition-all duration-300',
              isSidebarOpen ? 'ml-60' : 'ml-[72px]'
            )}
          >
            <header className={cn(
              'h-16 flex items-center justify-between px-6 border-b',
              isBackend ? 'border-white/10 bg-white/5 backdrop-blur' : 'border-slate-200 bg-white'
            )}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">
                  闪
                </div>
                <div>
                  <div className="font-bold text-base tracking-tight">闪跑侠调度中心</div>
                  <div className={cn('text-xs', isBackend ? 'text-white/50' : 'text-slate-500')}>
                    {currentRole === 'dispatcher' ? '调度监控系统 v2.0' : '财务管理系统 v2.0'}
                  </div>
                </div>
              </div>
              <RoleSwitcher />
            </header>
            <main className="flex-1 overflow-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRole + location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}

      {isMobileFrontend && (
        <>
          <header className={cn(
            'h-14 flex items-center justify-between px-4 border-b sticky top-0 z-40',
            'bg-white/80 backdrop-blur-lg border-slate-200'
          )}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/25">
                闪
              </div>
              <span className="font-bold tracking-tight text-slate-800">闪跑侠</span>
            </div>
            <RoleSwitcher />
          </header>

          <main className="flex-1 pb-24 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRole + location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

          <BottomNav />
        </>
      )}

      <Toast />
    </div>
  );
};

export default AppLayout;
