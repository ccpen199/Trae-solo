import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Landmark, QrCode, User, Lock, ArrowRight, Smartphone, Wifi, Map, Sparkles, X, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, type UserRole } from '@/store/useAuthStore';

const roleCards: { key: UserRole; title: string; subtitle: string; icon: typeof Landmark; hint: string; defaultUsername: string }[] = [
  {
    key: 'museum',
    title: '文博单位',
    subtitle: '博物馆 / 纪念馆 / 文物局',
    icon: Landmark,
    hint: '展品内容、讲解脚本、文化史料',
    defaultUsername: 'museum_admin',
  },
  {
    key: 'operator',
    title: '景区运营方',
    subtitle: '景区管委会 / 运营公司',
    icon: Building2,
    hint: 'POI点位、动线配置、数据运营',
    defaultUsername: 'operator_admin',
  },
  {
    key: 'visitor',
    title: '游客入口',
    subtitle: '微信扫码 · 免安装',
    icon: Smartphone,
    hint: '手机扫码即用，AR/图文导览',
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
      return (fx === 0 || fx === 6 || fy === 0 || fy === 6) || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
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

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [logging, setLogging] = useState(false);
  const authLogin = useAuthStore((s) => s.login);
  const loginAsVisitor = useAuthStore((s) => s.loginAsVisitor);
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setSuccessMsg('');

    if (role === 'visitor') {
      setShowVisitorModal(true);
      return;
    }

    const card = roleCards.find((c) => c.key === role);
    if (card) setUsername(card.defaultUsername);
    setPassword('123456');
  };

  const handleVisitorEnter = () => {
    setShowVisitorModal(false);
    loginAsVisitor();
    setTimeout(() => navigate('/visitor/welcome/scenic-1'), 100);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedRole) {
      setError('请先选择您的身份类型');
      return;
    }
    if (selectedRole === 'visitor') {
      loginAsVisitor();
      navigate('/visitor/welcome/scenic-1');
      return;
    }
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLogging(true);

    setTimeout(() => {
      const result = authLogin(username, password);

      if (!result.success) {
        setError(result.error || '登录失败，请检查账号密码');
        setLogging(false);
        return;
      }

      if (result.role !== selectedRole) {
        const actualLabel = result.role === 'museum' ? '文博单位' : result.role === 'operator' ? '景区运营方' : '游客';
        const selLabel = selectedRole === 'museum' ? '文博单位' : '景区运营方';
        setError(`该账号属于「${actualLabel}」，与您选择的「${selLabel}」身份不匹配`);
        setLogging(false);
        return;
      }

      setSuccessMsg(`身份验证通过 · 正在进入${selectedRole === 'museum' ? '文博内容' : '运营管理'}工作台…`);
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 500);
    }, 400);
  };

  const showLoginForm = selectedRole === 'museum' || selectedRole === 'operator';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-2xl rounded-3xl p-8 md:p-10 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-indigo-800/40 border border-indigo-700/30 mb-4">
            <Map className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">AR景区导览</h1>
          <div className="mt-2.5 h-0.5 w-14 mx-auto rounded-full bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          <p className="text-[11px] text-gray-500 mt-3 tracking-wider">内容管理系统 · Content Management Platform</p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-3 tracking-wide">请选择您的身份</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {roleCards.map((card) => {
              const active = selectedRole === card.key;
              return (
                <motion.button
                  key={card.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleSelect(card.key)}
                  className={`text-left rounded-2xl p-4 border-2 transition-all duration-200 ${
                    active
                      ? 'bg-indigo-900/40 border-amber-600/60 shadow-[0_0_0_4px_rgba(255,143,0,0.08)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8'
                  }`}
                  type="button"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-amber-600/20' : 'bg-white/5'}`}>
                    <card.icon size={20} className={active ? 'text-amber-500' : 'text-gray-400'} />
                  </div>
                  <p className={`text-sm font-semibold mb-0.5 ${active ? 'text-white' : 'text-gray-300'}`}>{card.title}</p>
                  <p className="text-[10px] text-gray-500 mb-2 leading-snug">{card.subtitle}</p>
                  <p className={`text-[10px] leading-snug ${active ? 'text-amber-400/90' : 'text-gray-600'}`}>{card.hint}</p>
                  {active && card.defaultUsername && (
                    <p className="text-[9px] text-indigo-300/80 mt-2 font-mono">默认账号：{card.defaultUsername}</p>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {showLoginForm && (
          <div className="pb-2">
            <div className="gold-divider my-5" />

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-gray-400 mb-1.5 block tracking-wide">用户名</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder="请输入用户名"
                    autoFocus
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600/60 focus:ring-2 focus:ring-amber-600/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 mb-1.5 block tracking-wide">密码</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="请输入密码"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600/60 focus:ring-2 focus:ring-amber-600/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <label className="flex items-center gap-1.5 text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="accent-amber-600 w-3 h-3" />
                  记住登录状态
                </label>
                <span className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">忘记密码？</span>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 py-2.5 px-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 text-xs text-emerald-400 py-2.5 px-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={logging}
                className={`w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 ${
                  logging
                    ? 'bg-indigo-900/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 hover:from-indigo-800 hover:via-indigo-700 hover:to-indigo-800'
                }`}
              >
                {logging ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    正在验证…
                  </>
                ) : (
                  <>
                    登录{selectedRole === 'museum' ? '文博内容' : '运营管理'}工作台
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {!showLoginForm && !showVisitorModal && (
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              👆 请在上方选择「文博单位」「景区运营方」或「游客入口」
              <br />
              <span className="text-gray-600">测试账号：museum_admin / operator_admin　默认密码：123456</span>
            </p>
          </div>
        )}

        {showLoginForm && (
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-[10px] text-gray-600 text-center leading-relaxed">
              测试账号：museum_admin（文博单位）· operator_admin（景区运营方）　默认密码：123456
            </p>
          </div>
        )}
      </motion.div>

      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div
            className="glass w-full max-w-md rounded-3xl p-8 relative"
          >
            <button
              onClick={() => setShowVisitorModal(false)}
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
                onClick={handleVisitorEnter}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-sm font-medium text-white hover:from-indigo-800 hover:to-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                直接在浏览器中体验
                <ArrowRight size={16} />
              </button>
              <p className="text-[10px] text-gray-600 mt-3">
                模拟扫码进入游客端 · 含AR能力检测与离线预加载
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
