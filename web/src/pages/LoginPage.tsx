import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api';

const PHONE_REGEX = /^1\d{10}$/;
const CODE_REGEX = /^\d{6}$/;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const validatePhone = (phoneNum: string): string | null => {
    if (!phoneNum.trim()) return '请输入手机号';
    if (!PHONE_REGEX.test(phoneNum)) return '手机号格式错误，需为11位数字';
    return null;
  };

  const validateCode = (codeStr: string): string | null => {
    if (!codeStr.trim()) return '请输入验证码';
    if (!CODE_REGEX.test(codeStr)) return '验证码格式错误，需为6位数字';
    return null;
  };

  const handleSendCode = async () => {
    if (countdown > 0) return;
    const phoneError = validatePhone(phone);
    if (phoneError) {
      alert(phoneError);
      return;
    }
    try {
      await authApi.sendCode(phone);
      alert('验证码已发送');
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
    } catch (error: any) {
      const msg = error.response?.data?.message || '发送验证码失败';
      alert(msg);
    }
  };

  const handleLogin = async () => {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      alert(phoneError);
      return;
    }
    const codeError = validateCode(code);
    if (codeError) {
      alert(codeError);
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ phone, code });
      login(res.token, res.user);
      if (res.user.role === 'property') {
        navigate('/property/dashboard', { replace: true });
      } else if (res.user.role === 'operator') {
        navigate('/operator/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || '登录失败，请稍后重试';
      alert(msg);
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
                placeholder="请输入11位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="请输入6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
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

          <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
            <p>测试账号：13800138002 居民 / 13800138001 物业 / 13800138000 运营</p>
            <p>验证码：123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
