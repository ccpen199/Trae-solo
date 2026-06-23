import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck } from 'lucide-react';
import { auth as authApi } from '@/api';
import { useAuthStore } from '@/store/auth';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11 || countdown > 0) return;
    try {
      await authApi.sendCode(phone);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {}
  };

  const handleLogin = async () => {
    if (!phone || !code) return;
    setLoading(true);
    try {
      await login(phone, code);
      await fetchMe();
      const state = useAuthStore.getState();
      if (state.needRealname) navigate('/auth/realname');
      else if (state.needBindUnion) navigate('/auth/bind-union');
      else navigate('/home');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 320" className="w-full">
          <path fill="#9A1725" fillOpacity="0.3" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold mb-2">杭州市总工会</h1>
          <p className="text-white/70 text-sm">数字化职工服务平台</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-5">
            <label className="text-sm text-union-muted mb-1.5 block">手机号码</label>
            <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
              <Phone size={18} className="text-union-muted mr-2" />
              <input
                type="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入手机号码"
                className="flex-1 outline-none text-sm text-union-text"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-union-muted mb-1.5 block">验证码</label>
            <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
              <ShieldCheck size={18} className="text-union-muted mr-2" />
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入验证码"
                className="flex-1 outline-none text-sm text-union-text"
              />
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || phone.length !== 11}
                className="text-primary text-xs font-medium ml-2 whitespace-nowrap disabled:text-union-muted disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={!phone || !code || loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </div>
      </div>
    </div>
  );
}
