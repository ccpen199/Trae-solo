import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  ShieldCheck,
  Store,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/entity';

type LoginRole = 'RESIDENT' | 'PROPERTY_STAFF' | 'COMMUNITY_ADMIN' | 'MERCHANT';

const roleTabs: { key: LoginRole; label: string; icon: typeof Home }[] = [
  { key: 'RESIDENT', label: '业主', icon: Home },
  { key: 'PROPERTY_STAFF', label: '物业管家', icon: Building2 },
  { key: 'COMMUNITY_ADMIN', label: '物业管理员', icon: ShieldCheck },
  { key: 'MERCHANT', label: '商户', icon: Store },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useUserStore();

  const [selectedRole, setSelectedRole] = useState<LoginRole>('RESIDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const mockUser = {
        id: 'u001',
        username,
        realName: username,
        phone: '138****8888',
        email: `${username}@example.com`,
        avatar: '',
        role: selectedRole as UserRole,
        communityId: 'c001',
        buildingId: 'b001',
        unitId: 'u001',
        roomId: 'r001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      login(mockUser, mockToken);
      setIsLoading(false);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-primary-950/30 to-slate-950" />

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(51, 102, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51, 102, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-white via-primary-100 to-white bg-clip-text text-transparent mb-2">
              智居云
            </h1>
            <p className="text-neutral-400 text-sm">智慧社区 · 美好生活</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6"
          >
            <div className="grid grid-cols-4 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              {roleTabs.map((role, index) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.key;
                return (
                  <motion.button
                    key={role.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.05 }}
                    onClick={() => setSelectedRole(role.key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-b from-primary-500/20 to-primary-500/5 text-primary-300 shadow-inner'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors',
                        isActive ? 'text-primary-400' : 'text-neutral-500'
                      )}
                    />
                    <span className="text-xs font-medium">{role.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm text-neutral-400 mb-2 font-medium">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2 font-medium">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="text-sm text-neutral-400">记住我</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                忘记密码？
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              className={cn(
                'w-full py-3 rounded-xl font-medium text-white transition-all duration-300 relative overflow-hidden',
                isLoading
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 hover:shadow-lg hover:shadow-primary-500/25'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-xs text-neutral-500">其他登录方式</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="flex justify-center gap-6">
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all duration-300">
                  <Smartphone className="w-5 h-5 text-neutral-400 group-hover:text-primary-400 transition-colors" />
                </div>
                <span className="text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors">
                  验证码登录
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-xs text-neutral-600 mt-6"
        >
          登录即表示同意《用户协议》和《隐私政策》
        </motion.p>
      </motion.div>
    </div>
  );
}
