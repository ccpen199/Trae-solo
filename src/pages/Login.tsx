import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Phone,
  Lock,
  User,
  Home,
  Building2,
  Briefcase,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { formatPhone } from '../utils/format';
import type { User as UserType } from '@shared/types';

type RoleType = UserType['role'];

const roles: { value: RoleType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'user', label: '普通用户', icon: Home, desc: '找房、看房、预约' },
  { value: 'owner', label: '业主', icon: Building2, desc: '发布房源、管理' },
  { value: 'agent', label: '经纪人', icon: Briefcase, desc: '专业房产服务' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, setError } = useUserStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('user');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone) {
      setError('请输入手机号');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    if (!agreeTerms) {
      setError('请阅读并同意用户协议和隐私政策');
      return;
    }

    const success = await login(cleanedPhone, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-500">登录您的账号，享受更多服务</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                选择您的身份
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          isSelected ? 'text-primary-600' : 'text-gray-700'
                        }`}
                      >
                        {role.label}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {roles.find((r) => r.value === selectedRole)?.desc}
              </p>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={handlePhoneChange}
                  placeholder="请输入手机号"
                  className="input-base pl-10"
                  maxLength={13}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-base pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  agreeTerms
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                {agreeTerms && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className="text-sm text-gray-600">
                我已阅读并同意
                <Link to="/terms" className="text-primary-600 hover:underline">
                  《用户协议》
                </Link>
                和
                <Link to="/privacy" className="text-primary-600 hover:underline">
                  《隐私政策》
                </Link>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-500">
                  其他登录方式
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-6">
              <button className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.433 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.264-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
                </svg>
              </button>
              <button className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center text-sm text-gray-600">
            还没有账号？
            <Link
              to="/register"
              className="text-primary-600 font-medium hover:underline"
            >
              立即注册
            </Link>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 card p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">演示账号</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-600">普通用户：</span>
                <span className="font-mono text-gray-900">13800138000</span>
              </div>
              <button
                onClick={() => {
                  setPhone('13800138000');
                  setPassword('123456');
                  setSelectedRole('user');
                }}
                className="text-primary-600 hover:text-primary-700"
              >
                填入
              </button>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-600">业主账号：</span>
                <span className="font-mono text-gray-900">13900139000</span>
              </div>
              <button
                onClick={() => {
                  setPhone('13900139000');
                  setPassword('123456');
                  setSelectedRole('owner');
                }}
                className="text-primary-600 hover:text-primary-700"
              >
                填入
              </button>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-600">经纪人账号：</span>
                <span className="font-mono text-gray-900">13700137000</span>
              </div>
              <button
                onClick={() => {
                  setPhone('13700137000');
                  setPassword('123456');
                  setSelectedRole('agent');
                }}
                className="text-primary-600 hover:text-primary-700"
              >
                填入
              </button>
            </div>
            <p className="text-gray-400 mt-2">密码均为：123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
