import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore, useToastStore } from '@/store';

export default function Login() {
  const [loginType, setLoginType] = useState('code');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const showToast = useToastStore((state) => state.showToast);

  const from = location.state?.from?.pathname || '/';

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入有效的手机号', 'error');
      return;
    }

    try {
      await authApi.sendCode(phone);
      showToast('验证码已发送（测试：123456）', 'success');
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
      showToast('发送失败', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone) {
      showToast('请输入手机号', 'error');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (loginType === 'code') {
        if (!code) {
          showToast('请输入验证码', 'error');
          setLoading(false);
          return;
        }
        response = await authApi.loginCode(phone, code);
      } else {
        if (!password) {
          showToast('请输入密码', 'error');
          setLoading(false);
          return;
        }
        response = await authApi.loginPassword(phone, password);
      }

      const { token, user } = response.data.data;
      login(token, user);
      showToast('登录成功', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      showToast(error.response?.data?.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-neutral-800 mb-6 text-center">欢迎登录</h1>

        <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setLoginType('code')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginType === 'code'
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-500'
            }`}
          >
            验证码登录
          </button>
          <button
            onClick={() => setLoginType('password')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginType === 'password'
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-500'
            }`}
          >
            密码登录
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={11}
            />
          </div>

          {loginType === 'code' ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">验证码</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入验证码"
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    countdown > 0
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（测试：123456）"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          测试账号：13800000001-13800000005，密码/验证码：123456
        </p>
      </div>
    </div>
  );
}
