import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Building2 } from 'lucide-react';
import { useAppStore } from '@/store';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const loading = useAppStore((state) => state.loading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(45,157,114,0.3),transparent_50%)]"></div>
        
        <div className="relative z-10 p-16 flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Building2 size={32} className="text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">苏州城市数字服务中台</h1>
                <p className="text-white/70 mt-1">Suzhou Urban Digital Service Platform</p>
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              数字赋能
              <br />
              <span className="text-accent-400">智慧苏州</span>
            </h2>
            <p className="mt-6 text-white/80 leading-relaxed">
              以市民身份为主干，支撑交通、文旅、企业服务、商业服务四大业务域，
              构建一体化城市数字服务生态。
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">125万+</div>
                <div className="text-white/70 text-sm mt-1">实名认证市民</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">856万+</div>
                <div className="text-white/70 text-sm mt-1">累计交易笔数</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">300+</div>
                <div className="text-white/70 text-sm mt-1">全国一卡通城市</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-white/70 text-sm mt-1">A级景区接入</div>
              </div>
            </div>
          </div>

          <div className="text-white/60 text-sm">
            © 2024 苏州市大数据管理局 · 苏州城市数字服务中台
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mt-4">苏州城市数字服务中台</h1>
            <p className="text-gray-500 text-sm mt-1">运营管理平台</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">运营管理员登录</h2>
              <p className="text-gray-500 text-sm mt-2">请输入您的账号密码登录系统</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600">
                  <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary-500 focus:ring-primary-400" />
                  记住登录状态
                </label>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">忘记密码?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-float hover:shadow-popup disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    登录中...
                  </span>
                ) : (
                  '登 录'
                )}
              </button>

              <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
                <p>测试账号: admin / admin123</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
