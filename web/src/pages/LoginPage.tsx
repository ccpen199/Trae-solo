import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phone || countdown > 0) return;
    try {
      await authApi.sendCode(phone);
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
    } catch (error) {
      alert('发送验证码失败');
    }
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      alert('请输入手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ phone, code });
      login(res.token, res.user);
      if (res.user.role === 'property') {
        navigate('/property/dashboard');
      } else if (res.user.role === 'operator') {
        navigate('/operator/dashboard');
      } else {
        navigate('/home');
      }
    } catch (error) {
      alert('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-primary-500 to-primary-700 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-white">社区共享设备服务</h1>
          <p className="text-primary-100 mt-2">便捷生活，智慧共享</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">登录</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    countdown > 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-60 transition-all shadow-lg shadow-primary-500/30"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>测试账号：13800138002居民 / 13800138001物业 / 13800138000运营，验证码任意6位</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
