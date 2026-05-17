import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Baby } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/Toast';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'parent' | 'grandparent'>('parent');

  const { login, register, isLoading, token } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !password) {
      showToast('请填写手机号和密码', 'error');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('手机号格式不正确', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('密码至少6位', 'error');
      return;
    }

    try {
      if (isLogin) {
        await login(phone, password, role);
        showToast('登录成功！', 'success');
      } else {
        if (!nickname) {
          showToast('请填写昵称', 'error');
          return;
        }
        await register(phone, password, nickname, role);
        showToast('注册成功！', 'success');
      }
      navigate('/');
    } catch (error: any) {
      showToast(error.errorMessage || '操作失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-sky/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Baby className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">宝宝时光机</h1>
          <p className="text-gray-500 mt-2">记录宝宝成长的每一个瞬间</p>
        </div>

        <div className="card">
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                isLogin ? 'bg-white text-primary shadow' : 'text-gray-500'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                !isLogin ? 'bg-white text-primary shadow' : 'text-gray-500'
              }`}
            >
              注册
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setRole('parent')}
              className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${
                role === 'parent'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              👨‍👩‍👧 父母版
            </button>
            <button
              onClick={() => setRole('grandparent')}
              className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${
                role === 'grandparent'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              👴 祖辈版
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="input"
                maxLength={11}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  className="input"
                  maxLength={20}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              测试账号：13800000001 / 123456
            </p>
            <p className="text-sm text-gray-500 mt-1">
              管理员：13800138000 / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
