import { useEffect, useRef, useState, FormEvent } from 'react';
import { Building2, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const demoAccounts = [
  { label: '平台管理员', username: 'admin', password: 'admin123' },
  { label: '运营专员', username: 'platform', password: 'platform123' },
  { label: '政务运维', username: 'ops', password: 'ops123' },
];

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const autoLoginStarted = useRef(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = '请输入用户名';
    if (!password) newErrors.password = '请输入密码';
    if (password && password.length < 6) newErrors.password = '密码长度不能少于6位';
    return newErrors;
  };

  const errors = validateForm();

  useEffect(() => {
    if (autoLoginStarted.current) return;
    autoLoginStarted.current = true;

    const timer = window.setTimeout(() => {
      void handleDemoLogin(demoAccounts[0]);
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setError('');

    console.log('[Login] 表单提交, 账号:', username);

    try {
      const result = await login(username, password);
      console.log('[Login] login() 返回结果:', result);
      
      if (result.success && result.user) {
        const user = result.user;
        let targetPath = '/dashboard';
        if (user.role === 'admin') {
          targetPath = '/dashboard';
        } else if (user.role === 'platform') {
          targetPath = '/appeals';
        } else if (user.role === 'ops') {
          targetPath = '/services';
        } else if (user.role === 'enterprise') {
          targetPath = '/policies';
        }
        
        console.log('[Login] 即将跳转到:', targetPath);
        
        setTimeout(() => {
          const storage = localStorage.getItem('auth-storage-manual');
          console.log('[Login] 跳转前 localStorage 验证:', storage ? '已存在' : '不存在');
          
          if (storage) {
            try {
              const parsed = JSON.parse(storage);
              console.log('[Login] 存储的 isAuthenticated:', parsed.isAuthenticated);
              console.log('[Login] 存储的 user:', parsed.user?.name);
            } catch (e) {
              console.error('[Login] 解析 localStorage 失败:', e);
            }
          }
          
          console.log('[Login] 执行跳转: window.location.href =', targetPath);
          window.location.href = targetPath;
        }, 300);
      } else {
        console.log('[Login] 登录失败, 显示错误:', result.error);
        setError(result.error || '登录失败，请稍后重试');
      }
    } catch (err) {
      console.error('[Login] 异常:', err);
      setError('系统异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof demoAccounts[number]) => {
    setUsername(account.username);
    setPassword(account.password);
    setTouched({ username: true, password: true });
    setError('');
    setLoading(true);
    
    console.log('[Login] 演示账号登录:', account.label, account.username);
    
    try {
      const result = await login(account.username, account.password);
      console.log('[Login] login() 返回结果:', result);
      
      if (result.success && result.user) {
        const user = result.user;
        let targetPath = '/dashboard';
        if (user.role === 'admin') {
          targetPath = '/dashboard';
        } else if (user.role === 'platform') {
          targetPath = '/appeals';
        } else if (user.role === 'ops') {
          targetPath = '/services';
        } else if (user.role === 'enterprise') {
          targetPath = '/policies';
        }
        
        console.log('[Login] 即将跳转到:', targetPath);
        
        setTimeout(() => {
          const storage = localStorage.getItem('auth-storage-manual');
          console.log('[Login] 跳转前 localStorage 验证:', storage ? '已存在' : '不存在');
          
          if (storage) {
            try {
              const parsed = JSON.parse(storage);
              console.log('[Login] 存储的 isAuthenticated:', parsed.isAuthenticated);
              console.log('[Login] 存储的 user:', parsed.user?.name);
            } catch (e) {
              console.error('[Login] 解析 localStorage 失败:', e);
            }
          }
          
          console.log('[Login] 执行跳转: window.location.href =', targetPath);
          window.location.href = targetPath;
        }, 300);
      } else {
        console.log('[Login] 登录失败, 显示错误:', result.error);
        setError(result.error || '登录失败，请稍后重试');
      }
    } catch (err) {
      console.error('[Login] 异常:', err);
      setError('系统异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a56db] via-[#1e3a8a] to-[#172554] p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-[#1a56db]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">广东省涉企政务服务平台</h1>
          <p className="text-blue-200">Guangdong Enterprise Government Services Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">欢迎登录</h2>
          <p className="text-gray-500 mb-6">请输入您的账号信息</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="form-label">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                  placeholder="请输入用户名"
                  className={cn(
                    'input-field pl-10',
                    touched.username && errors.username && 'border-red-300 focus:ring-red-500'
                  )}
                />
              </div>
              {touched.username && errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="请输入密码"
                  className={cn(
                    'input-field pl-10 pr-10',
                    touched.password && errors.password && 'border-red-300 focus:ring-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#1a56db] focus:ring-[#1a56db]" />
                <span className="text-sm text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-[#1a56db] hover:underline">忘记密码？</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-2 text-xs font-medium text-[#1a56db] hover:bg-blue-100"
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mb-3 text-xs text-gray-500">
              演示账号：admin:admin123 / platform:platform123 / ops:ops123
            </p>
            <p className="text-sm text-gray-500">
              还没有账号？ <a href="#" className="text-[#1a56db] hover:underline font-medium">立即注册</a>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-sm mt-8">
          © 2024 广东省人民政府办公厅 版权所有
        </p>
      </div>
    </div>
  );
}
