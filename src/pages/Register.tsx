import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeft,
  Home,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    verifyCode: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendCode = () => {
    if (countdown > 0 || !formData.phone) return;
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('两次密码输入不一致');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: '1',
        phone: formData.phone,
        nickname: formData.nickname || '新用户',
        role: 'user',
        createdAt: new Date(),
      });
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-primary-700 font-bold text-2xl mb-8 font-heading"
        >
          <Home className="w-7 h-7" />
          筑家数据
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">创建账号</h1>
            <p className="text-gray-500">加入筑家数据，开启装修灵感之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                昵称
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="请输入昵称"
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                手机号码
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号码"
                  className="input-base pl-10"
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                验证码
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.verifyCode}
                  onChange={(e) => setFormData({ ...formData, verifyCode: e.target.value })}
                  placeholder="请输入验证码"
                  className="input-base flex-1"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={countdown > 0}
                  className="px-4 py-2.5 bg-primary-50 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                设置密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入密码（至少6位）"
                  className="input-base pl-10 pr-12"
                  minLength={6}
                  required
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="请再次输入密码"
                  className="input-base pl-10 pr-12"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                我已阅读并同意
                <a href="#" className="text-primary hover:text-primary-600 mx-0.5">《用户协议》</a>
                和
                <a href="#" className="text-primary hover:text-primary-600 mx-0.5">《隐私政策》</a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              注册
            </button>
          </form>

          <div className="flex items-start gap-2 mt-6 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">
              是设计师？
              <Link to="/designer/register" className="font-medium underline ml-1">
                申请设计师入驻
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            已有账号?
            <Link to="/login" className="text-primary hover:text-primary-600 font-medium ml-1">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
