import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  ArrowRight,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/store';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: '1',
        phone: formData.phone,
        nickname: '用户' + formData.phone.slice(-4),
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">欢迎回来</h1>
            <p className="text-gray-500">登录你的账号，继续探索精彩案例</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入密码"
                  className="input-base pl-10 pr-12"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-500" />
                记住我
              </label>
              <a href="#" className="text-primary hover:text-primary-600">
                忘记密码?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              登录
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">或使用其他方式</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              微信登录
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors">
              <User className="w-5 h-5 text-blue-500" />
              验证码登录
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            还没有账号?
            <Link to="/register" className="text-primary hover:text-primary-600 font-medium ml-1">
              立即注册
              <ArrowRight className="w-4 h-4 inline" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
