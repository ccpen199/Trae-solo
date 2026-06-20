import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recycle, User, Menu, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'evaluate', label: '智能估价', href: '/evaluate' },
  { key: 'products', label: '商品库', href: '/products' },
  { key: 'inspectors', label: '检测师', href: '/inspectors' },
  { key: 'orders', label: '我的订单', href: '/orders' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-500',
        scrolled
          ? 'backdrop-blur-xl bg-ink-900/75 border-b border-white/[0.06] shadow-lg'
          : 'backdrop-blur-md bg-ink-900/40 border-b border-transparent',
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:shadow-gold transition-shadow duration-300">
              <Recycle className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="gold-text">臻回收</span>
              </span>
              <span className="text-[10px] text-ink-400 tracking-[0.2em] uppercase">
                Luxury Recycle
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'text-gold-400'
                      : 'text-ink-200 hover:text-ink-50 hover:bg-white/[0.03]',
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 inset-x-3 h-[2px] bg-gold-gradient rounded-full"
                      style={{ boxShadow: '0 0 10px rgba(201,169,98,0.6)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => (window.location.href = '/login')}
            >
              <User className="w-4 h-4" />
              登录
            </Button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-ink-200"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-white/[0.06] backdrop-blur-xl bg-ink-900/90"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gold-soft text-gold-400 border border-gold-500/20'
                      : 'text-ink-200 hover:bg-white/[0.04]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" size="md" className="w-full mt-2">
                <User className="w-4 h-4" />
                登录
              </Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export { Navbar };
