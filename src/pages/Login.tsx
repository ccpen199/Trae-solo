import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const demoAccounts = [
  { label: '管理员', username: 'admin', password: 'password123' },
  { label: '个人用户', username: 'zhangsan', password: 'password123' },
  { label: '企业用户', username: 'huawei_co', password: 'password123' },
];

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customerType, setCustomerType] = useState('individual');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register({ username, password, displayName, customerType });
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-csg-navy-dark via-csg-navy to-csg-navy-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-csg-green mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">南方电网</h1>
          <p className="text-blue-200 text-sm mt-1">能源服务数字生态平台</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {isRegister ? '注册账户' : '登录'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-csg-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field"
                    placeholder="请输入显示名称"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    客户类型
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="select-field"
                  >
                    <option value="individual">个人用户</option>
                    <option value="family">家庭用户</option>
                    <option value="enterprise">企业用户</option>
                    <option value="park">园区用户</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-center"
            >
              {loading ? '处理中...' : isRegister ? '注册' : '登录'}
            </button>
          </form>

          {!isRegister && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              <div className="mb-2 font-medium text-blue-900">演示账号</div>
              <div className="mb-2 font-mono text-[11px]">
                admin:password123 / zhangsan:password123 / huawei_co:password123
              </div>
              <div className="flex flex-wrap gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => {
                      setUsername(account.username);
                      setPassword(account.password);
                      setError('');
                    }}
                    className="rounded border border-blue-200 bg-white px-2 py-1 text-blue-700 hover:bg-blue-100"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isRegister ? '已有账户？' : '没有账户？'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-csg-navy dark:text-csg-green hover:underline ml-1 font-medium"
            >
              {isRegister ? '立即登录' : '立即注册'}
            </button>
          </div>
        </div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          © 2026 南方电网能源服务股份有限公司
        </p>
      </div>
    </div>
  );
}
