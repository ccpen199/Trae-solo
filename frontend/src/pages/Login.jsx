import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, MessageCircle, Shield } from 'lucide-react';
import useStore from '../store';
import { authApi } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { setToken, setUser, showToast, setLoading } = useStore();

  const sendCode = async () => {
    if (!phone || phone.length < 11) {
      showToast('请输入正确的手机号');
      return;
    }
    try {
      setLoading(true);
      await authApi.sendCode(phone);
      showToast('验证码已发送 (测试码: 123456)');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (error) {
      showToast(error.response?.data?.message || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loginType === 'phone') {
      if (!phone || !code) {
        showToast('请输入手机号和验证码');
        return;
      }
      try {
        setLoading(true);
        const res = await authApi.loginWithPhone(phone, code);
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        showToast('登录成功');
        if (res.data.user.isProfileComplete) {
          navigate('/');
        } else {
          navigate('/profile-setup');
        }
      } catch (error) {
        showToast(error.response?.data?.message || '登录失败');
      } finally {
        setLoading(false);
      }
    } else {
      if (!phone || !password) {
        showToast('请输入手机号和密码');
        return;
      }
      try {
        setLoading(true);
        const res = await authApi.loginWithPassword(phone, password);
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        showToast('登录成功');
        navigate('/');
      } catch (error) {
        showToast(error.response?.data?.message || '登录失败');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">JOIN</h1>
          <p className="text-gray-500 mt-2">设置问题、答题破冰、双向筛选</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setLoginType('phone')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                loginType === 'phone'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              验证码登录
            </button>
            <button
              onClick={() => setLoginType('password')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                loginType === 'password'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              密码登录
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {loginType === 'phone' ? (
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="w-full pl-12 pr-28 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={sendCode}
                  disabled={countdown > 0}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    countdown > 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all active:scale-[0.98]"
            >
              登录
            </button>

            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-gray-400 text-sm">其他登录方式</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              微信登录
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          登录即表示同意用户协议和隐私政策
        </p>
      </div>
    </div>
  );
};

export default Login;
