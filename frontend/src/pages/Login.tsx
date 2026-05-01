import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('请填写所有必填字段');
      return;
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const response = await api.post('/api/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        
        if (response.success) {
          login(response.data as { user: { id: string; email: string; name: string; role: string; isActive: boolean }; token: string });
          navigate('/');
        } else {
          setError(response.error || '登录失败');
        }
      } else {
        const response = await api.post('/api/auth/register', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        
        if (response.success) {
          login(response.data as { user: { id: string; email: string; name: string; role: string; isActive: boolean }; token: string });
          navigate('/');
        } else {
          setError(response.error || '注册失败');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">邮件营销系统</h1>
          <p className="text-neutral-500 mt-2">Email Marketing Platform</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-card border border-neutral-200 p-8">
          <div className="flex bg-neutral-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                isLogin ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                !isLogin ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              注册
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">姓名</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="请输入您的姓名"
                    className="input pl-10"
                    disabled={loading}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
              </div>
            )}
            
            <div>
              <label className="label">邮箱地址</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="请输入邮箱地址"
                  className="input pl-10"
                  disabled={loading}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
            </div>
            
            <div>
              <label className="label">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className="input pl-10 pr-10"
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {!isLogin && (
              <div>
                <label className="label">确认密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="请再次输入密码"
                    className="input pl-10 pr-10"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  处理中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? '登录' : '注册'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>© 2024 邮件营销系统. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
