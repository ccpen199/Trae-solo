import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck, User, CreditCard, Landmark } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyIdentity, isAuthenticated } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSendCode = () => {
    if (!phone || phone.length < 11) return;
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

  const handleLogin = () => {
    login(phone || '13800138000', code || '123456');
    navigate('/');
  };

  const handleVerify = () => {
    if (!realName || !idCard) return;
    const success = verifyIdentity(realName, idCard);
    if (success) {
      setShowVerify(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="gov-card overflow-hidden">
          <div className="gov-gradient-hero px-6 py-8 text-center">
            <Landmark className="w-10 h-10 text-white mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white mb-1">昆山市统一认证平台</h1>
            <p className="text-white/70 text-sm">登录后即可享受便捷政务服务</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gov-text mb-1.5">手机号码</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-text-secondary" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号码"
                  maxLength={11}
                  className="gov-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gov-text mb-1.5">验证码</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入验证码"
                  maxLength={6}
                  className="gov-input flex-1"
                />
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !phone || phone.length < 11}
                  className="gov-btn-secondary px-4 py-2.5 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            <button onClick={handleLogin} className="gov-btn-primary w-full py-3 text-base">
              登 录
            </button>

            <button
              onClick={handleLogin}
              className="w-full text-center text-sm text-gov-blue hover:underline"
            >
              注册/开通演示账户
            </button>

            {!showVerify && (
              <button
                onClick={() => setShowVerify(true)}
                className="w-full text-center text-sm text-gov-blue hover:underline flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                实名认证
              </button>
            )}

            {showVerify && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-gov-border pt-5 space-y-4"
              >
                <h3 className="text-sm font-semibold text-gov-text flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gov-blue" />
                  实名认证
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gov-text mb-1.5">真实姓名</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-text-secondary" />
                    <input
                      type="text"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="请输入真实姓名"
                      className="gov-input pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gov-text mb-1.5">身份证号</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-text-secondary" />
                    <input
                      type="text"
                      value={idCard}
                      onChange={(e) => setIdCard(e.target.value)}
                      placeholder="请输入身份证号码"
                      maxLength={18}
                      className="gov-input pl-9"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowVerify(false)} className="gov-btn-secondary flex-1 py-2.5 text-sm">
                    取消
                  </button>
                  <button onClick={handleVerify} className="gov-btn-orange flex-1 py-2.5 text-sm">
                    认证
                  </button>
                </div>
              </motion.div>
            )}

            <p className="text-xs text-gov-text-secondary text-center leading-relaxed">
              登录即表示同意
              <Link to="#" className="text-gov-blue hover:underline">《用户服务协议》</Link>
              和
              <Link to="#" className="text-gov-blue hover:underline">《隐私政策》</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
