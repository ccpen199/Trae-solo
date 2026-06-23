import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/auth';
import { post } from '@/utils/request';
import type { LoginResponse } from '@/types';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState('A7K9');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (!captcha.trim()) {
      setError('请输入验证码');
      return;
    }
    if (captcha.toUpperCase() !== captchaCode) {
      setError('验证码错误');
      refreshCaptcha();
      return;
    }

    try {
      setLoading(true);
      const data = await post<LoginResponse>('/auth/login', { username, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#006F3C] via-[#008751] to-[#00A86B] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              国家邮政业实名寄递
              <br />
              数字监管平台
            </h1>
            <p className="text-xl text-white/80 mb-12">收寄端系统</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">等保三级认证</span>
            </div>
          </div>
          <div className="absolute bottom-8 text-white/60 text-sm">
            © 2024 国家邮政局 版权所有
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">国家邮政业实名寄递数字监管平台</h1>
            <p className="text-gray-500 mt-1">收寄端系统</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">欢迎登录</h2>
            <p className="text-gray-500 mb-8">请输入账号密码以访问系统</p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">账号</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入账号"
                    className="w-full pl-10 pr-4 h-11 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-11 h-11 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">验证码</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      placeholder="请输入验证码"
                      maxLength={4}
                      className="w-full px-4 h-11 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div
                    onClick={refreshCaptcha}
                    className="h-11 px-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer select-none border border-gray-200 hover:from-gray-200 hover:to-gray-300 transition-colors group"
                    title="点击刷新"
                  >
                    <span className="font-mono text-lg font-bold tracking-widest text-gray-700 italic">
                      {captchaCode}
                    </span>
                    <RefreshCw className="w-4 h-4 ml-2 text-gray-500 group-hover:text-gray-700 group-hover:rotate-180 transition-transform duration-300" />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" loading={loading} className="w-full mt-6">
                登录
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>本系统符合等保三级要求，所有数据加密传输</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
