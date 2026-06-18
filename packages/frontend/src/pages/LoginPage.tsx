import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import * as authApi from '@/api/auth';

type LoginTab = 'password' | 'sms';

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !smsCode) return;
    setLoading(true);
    try {
      await authApi.register(phone, smsCode, '');
      await login(phone, '');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone || countdown > 0) return;
    try {
      await authApi.sendSmsCode(phone);
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
    } catch {}
  };

  const handleSamlLogin = () => {
    authApi.samlLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">邻里数字基座</h1>
          <p className="mt-2 text-gray-500">连接邻里，共建美好社区</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setTab('password')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'password'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              密码登录
            </button>
            <button
              onClick={() => setTab('sms')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'sms'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              验证码登录
            </button>
          </div>

          {tab === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="input-field pl-9"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-9"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? '登录中...' : '登录'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSmsLogin} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="input-field pl-9"
                />
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="验证码"
                    className="input-field pl-9"
                    maxLength={6}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="btn-secondary whitespace-nowrap text-sm disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? '登录中...' : '登录'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSamlLogin}
              className="btn-secondary w-full text-sm"
            >
              物业单点登录 (SAML SSO)
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            还没有账号？{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
