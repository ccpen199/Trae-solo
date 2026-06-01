import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';

interface FormErrors {
  username?: string;
  password?: string;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { login, isLoading, error, token, clearError } = useAuthStore();
  const navigate = useNavigate();
  const { success } = useToast();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    }
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const successLogin = await login({ username, password });
    if (successLogin) {
      success('登录成功');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">漏洞扫描平台</h1>
          <p className="text-navy-300">Vulnerability Scan Platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">用户登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: undefined });
                }}
                className={`input ${errors.username ? 'input-error' : ''}`}
                placeholder="请输入用户名"
                disabled={isLoading}
              />
              {errors.username && <p className="error-text">{errors.username}</p>}
            </div>

            <div>
              <label className="label">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="请输入密码"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              默认测试账号: admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
