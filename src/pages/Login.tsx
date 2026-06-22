import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Lock,
  MessageCircle,
  QrCode,
  ArrowLeft,
  Flower2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserStore();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; code?: string }>({});
  const [loginError, setLoginError] = useState('');

  const from = (location.state as { from?: string })?.from || '/';

  const validatePhone = (value: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!value) {
      return '请输入手机号';
    }
    if (!phoneRegex.test(value)) {
      return '请输入正确的手机号';
    }
    return '';
  };

  const validateCode = (value: string) => {
    if (!value) {
      return '请输入验证码';
    }
    if (value.length !== 6) {
      return '验证码为6位数字';
    }
    return '';
  };

  const handleSendCode = () => {
    const error = validatePhone(phone);
    if (error) {
      setErrors({ phone: error });
      return;
    }
    setErrors({});
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const phoneError = validatePhone(phone);
    const codeError = validateCode(code);

    if (phoneError || codeError) {
      setErrors({ phone: phoneError, code: codeError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const success = await login(phone, code);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setLoginError('验证码错误，请重新输入（测试验证码：123456）');
      }
    } catch (error) {
      setLoginError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = (platform: string) => {
    alert(`${platform}登录功能开发中，请使用手机号登录`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex bg-neutral-50"
    >
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/huizhou-city/1200/1600"
            alt="惠州城市风光"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-westlake-600/90 via-westlake-500/80 to-honghua-500/70" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Flower2 className="w-10 h-10 text-chaojing-300" />
              </div>
              <h1 className="text-4xl font-bold font-serif">惠州生活圈</h1>
            </div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl text-white/90 font-light mb-8"
            >
              让城市更有温度，让生活更加美好
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 text-center"
            >
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-3xl font-bold mb-1">10万+</p>
                <p className="text-sm text-white/70">注册用户</p>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-3xl font-bold mb-1">5000+</p>
                <p className="text-sm text-white/70">每日爆料</p>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-3xl font-bold mb-1">200+</p>
                <p className="text-sm text-white/70">兴趣圈子</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex flex-col justify-center p-6 md:p-12"
      >
        <div className="max-w-md mx-auto w-full">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-500 hover:text-westlake-600 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </motion.button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:hidden flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-westlake-500 to-westlake-600 flex items-center justify-center">
              <Flower2 className="w-7 h-7 text-chaojing-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-neutral-800">惠州生活圈</h1>
              <p className="text-sm text-neutral-500">让城市更有温度</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
              欢迎回来
            </h2>
            <p className="text-neutral-500">登录您的账号，开启美好生活</p>
          </motion.div>

          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-button flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-600">{loginError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                手机号
              </label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                error={errors.phone}
                prefix={<Phone className="w-5 h-5 text-neutral-400" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                验证码
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="请输入验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    error={errors.code}
                    prefix={<Lock className="w-5 h-5 text-neutral-400" />}
                  />
                </div>
                <Button
                  type="button"
                  variant={countdown > 0 ? 'outline' : 'secondary'}
                  size="md"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                测试验证码：123456
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              登录
            </Button>
          </motion.form>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex justify-between text-sm"
          >
            <button
              onClick={() => alert('注册功能开发中')}
              className="text-westlake-600 hover:text-westlake-700 font-medium transition-colors"
            >
              注册账号
            </button>
            <button
              onClick={() => alert('忘记密码功能开发中')}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              忘记密码？
            </button>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-neutral-50 text-neutral-500">其他登录方式</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-6">
              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleThirdPartyLogin('微信')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-neutral-600">微信登录</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleThirdPartyLogin('QQ')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-neutral-600">QQ登录</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
