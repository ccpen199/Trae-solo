import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Landmark, QrCode, User, Lock, ArrowRight, Smartphone, Wifi, Map, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

type RoleType = 'museum' | 'operator' | 'visitor';

const roleCards: { key: RoleType; title: string; subtitle: string; icon: typeof Landmark; hint: string; defaultUsername: string }[] = [
  {
    key: 'museum',
    title: '文博单位',
    subtitle: '博物馆 / 纪念馆 / 文物局',
    icon: Landmark,
    hint: '负责展品内容、讲解脚本、文化史料',
    defaultUsername: 'museum_admin',
  },
  {
    key: 'operator',
    title: '景区运营方',
    subtitle: '景区管委会 / 运营公司',
    icon: Building2,
    hint: '负责POI点位、动线配置、数据运营',
    defaultUsername: 'operator_admin',
  },
  {
    key: 'visitor',
    title: '游客入口',
    subtitle: '微信扫码 · 免安装',
    icon: Smartphone,
    hint: '手机扫码即用，支持AR/图文导览',
    defaultUsername: '',
  },
];

function QRCodeMock({ size = 180 }: { size?: number }) {
  const gridSize = 21;
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => {
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    const isFinder = (x < 7 && y < 7) || (x >= gridSize - 7 && y < 7) || (x < 7 && y >= gridSize - 7);
    if (isFinder) {
      const fx = x < 7 ? x : x >= gridSize - 7 ? x - (gridSize - 7) : x;
      const fy = y < 7 ? y : y >= gridSize - 7 ? y - (gridSize - 7) : y;
      const isOuter = fx === 0 || fx === 6 || fy === 0 || fy === 6;
      const isInner = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
      return isOuter || isInner;
    }
    return (x * 13 + y * 7 + x * y) % 3 === 0;
  });
  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="#fff" rx={8} />
      {cells.map((filled, i) => {
        if (!filled) return null;
        const x = (i % gridSize) * cellSize;
        const y = Math.floor(i / gridSize) * cellSize;
        return (
          <rect
            key={i}
            x={x + cellSize * 0.05}
            y={y + cellSize * 0.05}
            width={cellSize * 0.9}
            height={cellSize * 0.9}
            rx={cellSize * 0.2}
            fill="#1A237E"
          />
        );
      })}
      <rect
        x={size / 2 - cellSize * 1.5}
        y={size / 2 - cellSize * 1.5}
        width={cellSize * 3}
        height={cellSize * 3}
        rx={cellSize * 0.5}
        fill="#FF8F00"
      />
    </svg>
  );
}

function VisitorModal({ open, onClose, onEnter }: { open: boolean; onClose: () => void; onEnter: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md rounded-3xl p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-600/20 mb-5">
                <QrCode className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white mb-1">微信扫码体验</h2>
              <p className="text-xs text-gray-500 mb-6">打开微信扫一扫，立即开始AR导览</p>

              <div className="flex items-center justify-center mb-5">
                <div className="relative p-3 rounded-2xl bg-white/5 border border-white/10">
                  <QRCodeMock size={180} />
                  <motion.div
                    animate={{ y: [0, 176, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                    style={{ top: '12px' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6 text-left">
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <Smartphone className="w-4 h-4 text-indigo-400 mb-1.5" />
                  <p className="text-[10px] text-gray-400 leading-tight">扫码即用<br/>无需安装</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <Wifi className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <p className="text-[10px] text-gray-400 leading-tight">5km范围<br/>离线缓存</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <Sparkles className="w-4 h-4 text-amber-500 mb-1.5" />
                  <p className="text-[10px] text-gray-400 leading-tight">AR互动<br/>多语言讲解</p>
                </div>
              </div>

              <button
                onClick={onEnter}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-sm font-medium text-white hover:from-indigo-800 hover:to-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                直接在浏览器中体验
                <ArrowRight size={16} />
              </button>
              <p className="text-[10px] text-gray-600 mt-3">
                模拟扫码进入游客端 · 包含AR兼容性检测与离线预加载
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setError('');
    if (role === 'visitor') {
      setShowVisitorModal(true);
    } else {
      const card = roleCards.find((c) => c.key === role);
      if (card) setUsername(card.defaultUsername);
      setPassword('123456');
    }
  };

  const handleVisitorEnter = () => {
    setShowVisitorModal(false);
    login('visitor', '');
    navigate('/visitor/welcome/scenic-1');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedRole || selectedRole === 'visitor') return;
    const success = login(username, password);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-2xl rounded-3xl p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-indigo-800/40 border border-indigo-700/30 mb-5">
            <Map className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
            AR景区导览
          </h1>
          <div className="mt-3 h-0.5 w-16 mx-auto rounded-full bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          <p className="text-xs text-gray-500 mt-4 tracking-wider">内容管理系统 · Content Management Platform</p>
        </div>

        <div className="mb-8">
          <p className="text-xs text-gray-500 mb-3 tracking-wide">请选择您的身份</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {roleCards.map((card) => {
              const active = selectedRole === card.key;
              return (
                <motion.button
                  key={card.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleSelect(card.key)}
                  className={`text-left rounded-2xl p-4 border transition-all duration-200 ${
                    active
                      ? 'bg-indigo-900/40 border-amber-600/50 shadow-[0_0_0_3px_rgba(255,143,0,0.1)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    active ? 'bg-amber-600/20' : 'bg-white/5'
                  }`}>
                    <card.icon size={20} className={active ? 'text-amber-500' : 'text-gray-400'} />
                  </div>
                  <p className={`text-sm font-semibold mb-0.5 ${active ? 'text-white' : 'text-gray-300'}`}>
                    {card.title}
                  </p>
                  <p className="text-[10px] text-gray-500 mb-2 leading-snug">
                    {card.subtitle}
                  </p>
                  <p className={`text-[10px] leading-snug ${active ? 'text-amber-400/80' : 'text-gray-600'}`}>
                    {card.hint}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedRole && selectedRole !== 'visitor' && (
            <motion.form
              key="form"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onSubmit={handleSubmit}
              className="space-y-4 overflow-hidden"
            >
              <div className="gold-divider mb-5" />

              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名"
                  className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/10 transition-all"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-amber-600" />
                  记住登录状态
                </label>
                <span className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">忘记密码？</span>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-400 text-center py-2 rounded-lg bg-red-500/5 border border-red-500/10"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-sm font-semibold text-white hover:from-indigo-800 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2"
              >
                登录运营后台
                <ArrowRight size={15} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[10px] text-gray-600 text-center leading-relaxed">
            测试账号：museum_admin（文博单位）· operator_admin（运营方） · visitor（游客）
            <br />
            默认密码：123456
          </p>
        </div>
      </motion.div>

      <VisitorModal
        open={showVisitorModal}
        onClose={() => setShowVisitorModal(false)}
        onEnter={handleVisitorEnter}
      />
    </div>
  );
}
