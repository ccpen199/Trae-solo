import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Palette, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('employer@example.com');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'employer' | 'provider' | 'admin'>('employer');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password, role);
      navigate('/');
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  const quickLogin = async (r: 'employer' | 'provider' | 'admin') => {
    clearError();
    const emails = {
      employer: 'employer@example.com',
      provider: 'provider@example.com',
      admin: 'admin@example.com',
    };
    const passwords = {
      employer: '123456',
      provider: '123456',
      admin: 'admin123',
    };
    try {
      await login(emails[r], passwords[r], r);
      navigate('/');
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  const roleCards = [
    { role: 'employer' as const, label: '企业雇主', icon: Briefcase, desc: '发布需求，寻找服务商' },
    { role: 'provider' as const, label: '创意服务商', icon: Palette, desc: '投递方案，承接任务' },
    { role: 'admin' as const, label: '平台管理员', icon: Shield, desc: '运营管理，合规审计' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">创意众包平台</h1>
                    <p className="text-sm text-slate-500">连接创意，成就价值</p>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">欢迎登录</h2>
                <p className="text-slate-500 text-sm">请选择您的角色并登录系统</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {roleCards.map((card) => (
                  <button
                    key={card.role}
                    onClick={() => setRole(card.role)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      role === card.role
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <card.icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        role === card.role ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        role === card.role ? 'text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {card.label}
                    </p>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">登录密码</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none pr-12"
                      placeholder="请输入密码"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    '立即登录'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-3 text-center">快速登录体验</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => quickLogin('employer')}
                    className="py-2 px-3 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                  >
                    企业雇主
                  </button>
                  <button
                    onClick={() => quickLogin('provider')}
                    className="py-2 px-3 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                  >
                    创意服务商
                  </button>
                  <button
                    onClick={() => quickLogin('admin')}
                    className="py-2 px-3 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                  >
                    管理员
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden md:flex bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-4">专业的创意服务平台</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">多类型需求</p>
                      <p className="text-sm text-blue-100">UI/工业设计、软件开发、商标注册、文案策划</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">专业人才库</p>
                      <p className="text-sm text-blue-100">资质认证、作品集展示、历史履约评分</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">交易保障</p>
                      <p className="text-sm text-blue-100">资金托管、知识产权存证、争议仲裁</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-blue-100">
                <p>© 2026 创意众包平台</p>
                <p>让创意创造价值</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
