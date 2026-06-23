import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Film,
  MapPin,
  Popcorn,
  Gift,
  User,
  Search,
  ShoppingCart,
  Crown,
  Coins,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import Footer from './Footer';
import type { PACONNIELevel } from '@/types';

const levelIconColors: Record<PACONNIELevel, string> = {
  Bronze: 'text-amber-500',
  Silver: 'text-gray-300',
  Gold: 'text-cinema-gold',
  Platinum: 'text-cyan-400',
  Diamond: 'text-purple-400',
};

const levelLabels: Record<PACONNIELevel, string> = {
  Bronze: '青铜会员',
  Silver: '白银会员',
  Gold: '黄金会员',
  Platinum: '铂金会员',
  Diamond: '钻石会员',
};

const navItems = [
  { label: '首页', href: '/', icon: Home },
  { label: '影片', href: '/movies', icon: Film },
  { label: '影城', href: '/cinemas', icon: MapPin },
  { label: '卖品', href: '/concessions', icon: Popcorn },
  { label: '活动', href: '/promotions', icon: Gift },
  { label: '我的', href: '/member', icon: User },
];

export default function MainLayout() {
  const location = useLocation();
  const currentMember = useAppStore((state) => state.currentMember);
  const cartItems = useAppStore((state) => state.cartItems);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cinema-midnight">
      <header className="sticky top-0 z-50 bg-cinema-midnight/80 backdrop-blur-lg border-b border-white/5">
        <div className="container">
          <div className="flex items-center justify-between h-20 gap-8">
            <Link to="/" className="flex-shrink-0">
              <h1 className="font-display text-2xl text-gradient-gold tracking-widest">
                PACONNIE CINEMAS
              </h1>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'text-cinema-gold'
                      : 'text-white/80 hover:text-cinema-gold'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-cinema-goldDark via-cinema-gold to-cinema-goldLight rounded-full" />
                  )}
                </Link>
              );
            })}
            </nav>

            <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-muted" />
                <input
                  type="text"
                  placeholder="搜索电影、影城..."
                  className="w-full bg-cinema-midnightDark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-cinema-muted focus:outline-none focus:border-cinema-gold transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentMember && (
                <Link
                  to="/member"
                  className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-cinema-midnightLight border border-white/5 hover:border-cinema-gold/30 transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <Crown
                      className={cn('w-4 h-4', levelIconColors[currentMember.level])}
                    />
                    <span className="text-sm font-medium text-white/90">
                      {levelLabels[currentMember.level]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-cinema-gold">
                    <Coins className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">
                      {currentMember.points.toLocaleString()}
                    </span>
                  </div>
                </Link>
              )}

              <Link
                to="/cart"
                className="relative p-2.5 rounded-lg text-white/80 hover:text-cinema-gold hover:bg-cinema-midnightLight transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1.5 bg-cinema-red text-white text-xs font-bold rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav className="lg:hidden sticky top-20 z-40 bg-cinema-midnight/90 backdrop-blur-lg border-b border-white/5">
        <div className="container">
          <div className="flex items-center justify-between py-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-all duration-200 min-w-fit',
                    active
                      ? 'text-cinema-gold'
                      : 'text-white/70 hover:text-cinema-gold'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-8 pb-16">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
