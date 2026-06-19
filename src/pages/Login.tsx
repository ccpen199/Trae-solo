import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  AlertCircle,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type RoleTab = 'jobseeker' | 'hr';

const demoAccounts = {
  jobseeker: { email: 'demo@jobseeker.com', password: 'demo123456' },
  hr: { email: 'demo@hr.com', password: 'demo123456' },
};

export default function Login() {
  const navigate = useNavigate();
  const { setUser, currentDiagnosisReport } = useAppStore();

  const [roleTab, setRoleTab] = useState<RoleTab>('jobseeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email,
        password,
        role: roleTab,
      });

      setUser({
        isLoggedIn: true,
        profile: response.user,
        token: response.token,
      });

      if (roleTab === 'hr') {
        navigate('/hr/dashboard');
      } else {
        if (currentDiagnosisReport) {
          navigate('/diagnosis');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试';
      setError(message + '（演示模式：任意邮箱密码均可登录）');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    const demo = demoAccounts[roleTab];
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-space-indigo-50/60 to-lavender-50/60" />

      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-lavender-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-space-indigo-200/20 rounded-full blur-3xl" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-space-indigo-500 via-lavender-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-lavender-300/40">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-heading font-bold mb-2"
          >
            <span className="gradient-text">欢迎回来</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-slate-500 text-sm"
          >
            登录你的 CareerGraph 账号，开启职业成长之旅
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <Card variant="glass" className="p-8 shadow-2xl shadow-space-indigo-200/20">
            <div className="flex bg-slate-100/80 rounded-full p-1 mb-6">
              <button
                onClick={() => {
                  setRoleTab('jobseeker');
                  setError(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  roleTab === 'jobseeker'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <User className="w-4 h-4" />
                求职者登录
              </button>
              <button
                onClick={() => {
                  setRoleTab('hr');
                  setError(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  roleTab === 'hr'
                    ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Building2 className="w-4 h-4" />
                HR登录
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
              >
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱 / 手机号
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱或手机号"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-sm text-slate-600">记住我</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  忘记密码？
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-2"
              >
                <LogIn className="w-5 h-5" />
                登录
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200/60">
              <button
                onClick={fillDemoAccount}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors group"
              >
                <Sparkles className="w-3.5 h-3.5 group-hover:text-amber-gold-500 transition-colors" />
                <span>使用演示账号体验</span>
                <span className="text-emerald-500 font-medium group-hover:underline">一键填入</span>
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-6 text-sm text-slate-600"
        >
          还没有账号？
          <Link
            to="/register"
            className="ml-1 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            立即注册
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
