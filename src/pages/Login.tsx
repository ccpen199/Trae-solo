import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store';
import { apiFetch } from '@/lib/api';

type Role = 'personal' | 'enterprise' | 'admin';

const demoCredentials: Record<Role, { idNumber: string; password: string }> = {
  personal: { idNumber: '110101199001011234', password: '123456' },
  enterprise: { idNumber: '91110000MA01ABCDEF', password: 'enterprise' },
  admin: { idNumber: 'admin001', password: 'admin' },
};

export default function Login() {
  const [role, setRole] = useState<Role>('personal');
  const [idNumber, setIdNumber] = useState(demoCredentials.personal.idNumber);
  const [password, setPassword] = useState(demoCredentials.personal.password);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setToken, setMode } = useAppStore();
  const navigate = useNavigate();

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setIdNumber(demoCredentials[r].idNumber);
    setPassword(demoCredentials[r].password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<{
        token: string;
        user: { id: number; idNumber: string; name: string; role: Role; creditCode?: string };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ idNumber, password, role }),
      });
      setToken(data.token);
      setUser(data.user);
      if (data.user.role === 'enterprise') {
        setMode('enterprise');
      } else {
        setMode('personal');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-8 h-8 text-primary-700" />
            <h1 className="text-2xl font-bold text-primary-700">人社中台</h1>
          </div>

          <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
            {(['personal', 'enterprise', 'admin'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  role === r
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {r === 'personal' ? '个人' : r === 'enterprise' ? '企业' : '监管'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                {role === 'enterprise' ? '统一社会信用代码' : '身份证号'}
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={role === 'enterprise' ? '请输入信用代码' : '请输入身份证号'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-danger-500 bg-danger-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-400">演示账号已自动填入</p>
          </div>
        </div>
      </div>
    </div>
  );
}
