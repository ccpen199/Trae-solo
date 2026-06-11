import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Building2, Settings, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import type { UserRole } from '@/types';
import Button from '@/components/ui/Button';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [role, setRole] = useState<UserRole>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: 'personal', label: '个人用户', icon: User, desc: '参保个人服务' },
    { value: 'enterprise', label: '企业HR', icon: Building2, desc: '企业人事服务' },
    { value: 'admin', label: '管理员', icon: Settings, desc: '后台管理系统' },
  ];

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 600));
    login(role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'enterprise') {
      navigate('/');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg shadow-lg mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-600">省级人社一体化服务平台</h1>
          <p className="text-sm text-neutral-400 mt-2">Provincial HRSS Integrated Service Platform</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
          <div className="flex gap-2 mb-6 bg-neutral-50 p-1 rounded-xl">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRole(option.value as UserRole)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all duration-200 ${
                  role === option.value
                    ? 'bg-white shadow-md text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <option.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-2">
                {role === 'enterprise' ? '企业统一社会信用代码' : role === 'admin' ? '管理员账号' : '身份证号/手机号'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'enterprise' ? '请输入统一社会信用代码' : role === 'admin' ? '请输入管理员账号' : '请输入身份证号或手机号'}
                  className="w-full px-4 py-3 pl-4 pr-10 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                {username && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success-500" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-2">
                {role === 'admin' ? '密码' : '登录密码'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入登录密码"
                  className="w-full px-4 py-3 pr-10 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-neutral-500 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400" />
                记住登录状态
              </label>
              <a href="#" className="text-primary-500 hover:text-primary-600">忘记密码？</a>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-500">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleLogin}
              loading={loading}
              className="w-full py-3 text-base"
              size="lg"
            >
              安全登录
            </Button>

            {role === 'personal' && (
              <div className="flex items-center justify-center gap-6 pt-2">
                <button className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-500 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-success-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  电子社保卡登录
                </button>
                <button className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-500 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  人脸识别登录
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-neutral-400">
          <p>登录即表示同意<a href="#" className="text-primary-400">《用户服务协议》</a>和<a href="#" className="text-primary-400">《隐私政策》</a></p>
          <p className="mt-2">技术支持：省人力资源和社会保障信息中心</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
