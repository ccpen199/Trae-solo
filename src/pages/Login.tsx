import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login, getProfile } from '../services/api';
import { useAuthStore } from '../store/auth';
import type { UserRole } from '../../shared/types';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '管理员' },
  { value: 'operator', label: '运营专员' },
  { value: 'store_owner', label: '生活馆店主' },
  { value: 'sales', label: '直销员' },
];

const demoAccounts: Record<UserRole, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'admin123' },
  operator: { username: 'operator1', password: '123456' },
  store_owner: { username: 'store1', password: '123456' },
  sales: { username: 'sales1', password: '123456' },
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('sales');
  const [username, setUsername] = useState('sales1');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login: setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setUsername(demoAccounts[role].username);
    setPassword(demoAccounts[role].password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ username, password });
      if (result.code === 0) {
        setAuth(result.data.token, result.data.user);
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-brand-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <span className="text-4xl font-bold">新</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 animate-fade-in">新时代健康</h1>
            <h2 className="text-2xl font-light mb-6 opacity-90">产业专属展业协同平台</h2>
          </div>
          
          <div className="space-y-4 text-lg opacity-80">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>人-货-场 全链路数字化重构</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>AI驱动合规风控，多层级穿透式管理</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>数据看板驱动业务增长决策</span>
            </div>
          </div>

          <div className="absolute bottom-10 left-16 text-sm opacity-60">
            © 2024 新时代健康产业集团
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">新</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">新时代健康</h1>
            <p className="text-gray-500">展业协同平台</p>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h2>
          <p className="text-gray-500 mb-8">请选择角色并登录您的账户</p>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleChange(role.value)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  selectedRole === role.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="label">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="请输入密码"
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
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                记住密码
              </label>
              <Link to="#" className="text-primary-600 hover:text-primary-700 font-medium">
                忘记密码？
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  登录中...
                </>
              ) : (
                '登录系统'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">演示账号：</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>管理员: admin / admin123</p>
              <p>运营: operator1 / 123456</p>
              <p>店主: store1 / 123456</p>
              <p>直销员: sales1 / 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
