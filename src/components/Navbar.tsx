import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import {
  Home, Sparkles, Users, Gamepad2, FileText, LayoutDashboard,
  Scale, Wallet, User, ShieldAlert, Bell, ChevronDown, LogIn, Crown
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: '首页大厅', icon: Home },
  { path: '/publish', label: '发布需求', icon: Sparkles },
  { path: '/providers', label: '服务商广场', icon: Users },
  { path: '/account/games', label: '游戏账号', icon: Gamepad2 },
  { path: '/orders', label: '订单合约', icon: FileText },
  { path: '/wallet', label: '资金钱包', icon: Wallet },
  { path: '/arbitration', label: '争议仲裁', icon: Scale },
  { path: '/risk', label: '风控中心', icon: ShieldAlert },
];

export default function Navbar() {
  const location = useLocation();
  const currentUser = useAppStore(s => s.getCurrentUser());
  const wallet = useAppStore(s => s.wallet);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="h-20 bg-night-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="container h-full flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-11 h-11 rounded-xl bg-gradient-esports shadow-esports-glow flex items-center justify-center text-white font-display font-black text-lg"
            >
              ELO
            </motion.div>
            <div>
              <div className="heading-display text-xl text-gradient-esports">ELO MASTER</div>
              <div className="text-[10px] text-night-400 tracking-widest -mt-1">SKILL BROKER PLATFORM</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.slice(0, 6).map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-esports-300'
                      : 'text-night-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-esports-400/10 border border-esports-400/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-night-800/80 border border-white/5">
              <Wallet className="w-4 h-4 text-esports-400" />
              <div className="text-xs">
                <div className="text-night-400 leading-none">可用余额</div>
                <div className="data-number text-base text-gradient-gold leading-tight">¥{wallet.available.toFixed(2)}</div>
              </div>
            </div>

            <button className="relative p-2.5 rounded-xl bg-night-800/80 border border-white/5 hover:bg-night-700 transition-colors">
              <Bell className="w-4 h-4 text-night-300" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-victory-red animate-pulse" />
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(v => !v)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-night-800/80 border border-white/5 hover:border-esports-400/40 transition-all"
                >
                  <div className="relative">
                    <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full ring-2 ring-esports-400/50" />
                    {currentUser.realNameVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-esports flex items-center justify-center text-[8px] border-2 border-night-900">✓</span>
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{currentUser.nickname}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-night-400 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
                </button>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-3 w-64 rounded-2xl bg-night-800 border border-white/10 shadow-card overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={currentUser.avatar} alt="" className="w-12 h-12 rounded-full" />
                        <div>
                          <div className="font-semibold">{currentUser.nickname}</div>
                          <div className="text-xs text-night-400">{currentUser.phone}</div>
                          {currentUser.realNameVerified && (
                            <span className="status-success mt-1">已实名认证</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link to="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm">
                        <User className="w-4 h-4 text-night-400" />
                        个人中心
                      </Link>
                      <Link to="/account/games" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm">
                        <Gamepad2 className="w-4 h-4 text-night-400" />
                        账号管理
                      </Link>
                      <Link to="/wallet" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm">
                        <Wallet className="w-4 h-4 text-night-400" />
                        我的钱包
                      </Link>
                      {currentUser.role === 'booster' && (
                        <Link to={`/provider/${currentUser.id}`} onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm">
                          <Crown className="w-4 h-4 text-gold-500" />
                          服务商中心
                        </Link>
                      )}
                      {currentUser.role === 'admin' && (
                        <Link to="/risk" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm">
                          <LayoutDashboard className="w-4 h-4 text-night-400" />
                          运营后台
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="btn-primary py-2.5 px-5 text-sm">
                <LogIn className="w-4 h-4" />
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
