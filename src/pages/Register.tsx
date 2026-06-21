import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, User, Eye, EyeOff, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';

export default function Register() {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    nickname?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    agreed?: string;
  }>({});
  const { register, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthLabel = ['太弱', '较弱', '一般', '较强', '很强'];
  const strengthColor = ['bg-cinnabar-400', 'bg-cinnabar-400', 'bg-gold-500', 'bg-jade-500', 'bg-jade-600'];

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!nickname.trim()) {
      newErrors.nickname = '请输入昵称';
    } else if (nickname.length < 2) {
      newErrors.nickname = '昵称至少2个字符';
    }
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
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }
    if (!agreed) {
      newErrors.agreed = '请阅读并同意服务协议';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(phone, password, nickname);
      toast.success('注册成功，欢迎加入鉴真阁');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-paper">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-gold-200/20 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-jade-200/20 blur-3xl" />
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
          <h1 className="font-serif text-3xl font-bold text-jade-700 mb-2">创建账号</h1>
          <p className="text-jade-500">加入鉴真阁，与百万藏家一起传承文化</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">昵称</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  className={`input-field pl-11 ${errors.nickname ? 'border-cinnabar-400 focus:border-cinnabar-400 focus:ring-cinnabar-400' : ''}`}
                />
              </div>
              {errors.nickname && <p className="mt-1.5 text-sm text-cinnabar-500">{errors.nickname}</p>}
            </div>

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
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${i < passwordStrength() ? strengthColor[passwordStrength() - 1] : 'bg-rice-200'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-jade-500">
                    密码强度：<span className="font-medium">{passwordStrength() > 0 ? strengthLabel[passwordStrength() - 1] : '请输入密码'}</span>
                  </p>
                </div>
              )}
              {errors.password && <p className="mt-1.5 text-sm text-cinnabar-500">{errors.password}</p>}
            </div>

            <div>
              <label className="label-field">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'border-cinnabar-400 focus:border-cinnabar-400 focus:ring-cinnabar-400' : ''}`}
                />
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-500" />
                )}
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-sm text-cinnabar-500">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gold-300 text-gold-500 focus:ring-gold-400"
                />
                <span className="text-sm text-jade-600">
                  我已阅读并同意
                  <Link to="/terms" className="text-gold-600 hover:text-gold-500 mx-0.5">《服务协议》</Link>
                  和
                  <Link to="/privacy" className="text-gold-600 hover:text-gold-500 mx-0.5">《隐私政策》</Link>
                </span>
              </label>
              {errors.agreed && <p className="mt-1.5 text-sm text-cinnabar-500">{errors.agreed}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading} rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}>
              注册
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gold-200">
            <p className="text-center text-jade-500">
              已有账号？
              <Link to="/login" className="ml-1 text-gold-600 hover:text-gold-500 font-medium transition-colors">
                立即登录
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
