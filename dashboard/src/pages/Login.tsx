import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { FormInput } from '../components/common/FormInput';
import { Loading } from '../components/common/Loading';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch (err) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">沈阳市福利券管理平台</h1>
          <p className="text-gray-500">商户管理后台</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-600 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <FormInput
              label="用户名"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              autoComplete="username"
            >
              <User className="w-4 h-4" />
            </FormInput>

            <FormInput
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
            >
              <Lock className="w-4 h-4" />
            </FormInput>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  defaultChecked
                />
                记住我
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">测试账号</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium text-gray-700">admin / 123456</p>
                <p className="text-gray-500">管理员</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium text-gray-700">merchant / 123456</p>
                <p className="text-gray-500">商户管理员</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium text-gray-700">cashier / 123456</p>
                <p className="text-gray-500">收银员</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium text-gray-700">risk / 123456</p>
                <p className="text-gray-500">风控专员</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 沈阳市商务局 福利券管理平台
        </p>
      </div>
    </div>
  );
}
