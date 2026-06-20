import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Package, Truck, Users, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import type { UserRole } from 'shared/types';

const roleCredentials: Record<UserRole, { username: string; password: string; label: string; icon: typeof Package }> = {
  courier: { username: 'courier1', password: 'courier123', label: '快递员', icon: Truck },
  admin: { username: 'admin1', password: 'admin123', label: '管理员', icon: Shield },
  operator: { username: 'operator1', password: 'operator123', label: '运营员', icon: Users },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('courier');
  const [username, setUsername] = useState('courier1');
  const [password, setPassword] = useState('courier123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setUsername(roleCredentials[role].username);
    setPassword(roleCredentials[role].password);
    setError('');
    setErrors({});
  };

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    }
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码长度不能少于6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.message || '登录失败');
    }
  };

  const IconComponent = roleCredentials[selectedRole].icon;

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 30%),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 40px 40px, 40px 40px',
        }}
      />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
        <div className="text-center text-white max-w-md">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
              <Package className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl -z-10 blur-xl" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            快递揽收管理系统
          </h1>
          <p className="text-blue-200/80 text-lg mb-8 leading-relaxed">
            高效、智能的快递员上门揽收作业管理平台，支持订单分配、扫码核销、面单打印、财务对账等全流程数字化管理。
          </p>
          
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-blue-200/70">日处理订单</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-blue-200/70">准时率</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-blue-200/70">合作网点</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">快递揽收管理系统</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
              <p className="text-blue-200/70">请登录您的账户继续</p>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-blue-200 mb-3 block">选择角色</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(roleCredentials) as [UserRole, typeof roleCredentials[UserRole]][]).map(([role, config]) => {
                  const RoleIcon = config.icon;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                        selectedRole === role
                          ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white/5 border-white/10 text-blue-200/70 hover:bg-white/10 hover:border-white/20'
                      )}
                    >
                      <RoleIcon className="w-5 h-5" />
                      <span className="text-xs font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-blue-200 mb-2 block">用户名</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-5 h-5 text-blue-300/50" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: undefined });
                    }}
                    className={cn(
                      'w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 transition-all',
                      errors.username
                        ? 'border-red-400/50 focus:ring-red-400/30'
                        : 'border-white/10 focus:ring-blue-400/30 focus:border-blue-400/50'
                    )}
                    placeholder="请输入用户名"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-blue-200 mb-2 block">密码</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="w-5 h-5 text-blue-300/50" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={cn(
                      'w-full pl-12 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 transition-all',
                      errors.password
                        ? 'border-red-400/50 focus:ring-red-400/30'
                        : 'border-white/10 focus:ring-blue-400/30 focus:border-blue-400/50'
                    )}
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300/50 hover:text-blue-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-400/30"
                  />
                  <span className="text-sm text-blue-200/70">记住我</span>
                </label>
                <button type="button" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  忘记密码？
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <IconComponent className="w-5 h-5" />
                    登录
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-center text-blue-200/50 mb-3">演示账号</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <div className="text-blue-200 font-medium">快递员</div>
                  <div className="text-blue-300/60">courier1 / courier123</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <div className="text-blue-200 font-medium">管理员</div>
                  <div className="text-blue-300/60">admin1 / admin123</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <div className="text-blue-200 font-medium">运营员</div>
                  <div className="text-blue-300/60">operator1 / operator123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
