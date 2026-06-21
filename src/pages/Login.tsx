import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = (location.state as { from?: string } | null)?.from || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validate = () => {
    const newErrors: { phone?: string; password?: string } = {};
    if (!phone) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入正确的手机号';
    }
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(phone, password);
      toast.success('登录成功，欢迎回来');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '登录失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-paper">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gold-200/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-jade-200/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-lg bg-ink-gradient border-2 border-gold-400 shadow-gold-glow">
            <span className="font-serif text-3xl font-bold text-gold-300 text-shadow-gold">鉴</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-jade-700 mb-2">欢迎回来</h1>
          <p className="text-jade-500">登录鉴真阁，开启您的收藏之旅</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className={`input-field pl-11 ${errors.phone ? 'border-cinnabar-400 focus:border-cinnabar-400 focus:ring-cinnabar-400' : ''}`}
                  maxLength={11}
                />
              </div>
              {errors.phone && <p className="mt-1.5 text-sm text-cinnabar-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="label-field">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-cinnabar-400 focus:border-cinnabar-400 focus:ring-cinnabar-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-jade-400 hover:text-jade-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-cinnabar-500">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-jade-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gold-300 text-gold-500 focus:ring-gold-400" />
                记住我
              </label>
              <Link to="/forgot-password" className="text-gold-600 hover:text-gold-500 transition-colors">
                忘记密码？
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading} rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}>
              登录
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gold-200">
            <p className="text-center text-jade-500">
              还没有账号？
              <Link to="/register" className="ml-1 text-gold-600 hover:text-gold-500 font-medium transition-colors">
                立即注册
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-jade-400">
          <Shield className="w-4 h-4" />
          <span>您的信息将被安全加密保护</span>
        </div>
      </motion.div>
    </div>
  );
}
