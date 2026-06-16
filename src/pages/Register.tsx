import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Phone, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { UserRole } from '@shared/types';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'owner', label: '宠物主人', desc: '管理宠物健康档案' },
  { value: 'doctor', label: '执业兽医', desc: '提供在线问诊服务' },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await api.auth.register({ phone, password, nickname, role });
      login(user, token);
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cream-50 via-white to-forest-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-warm-300 to-warm-500 flex items-center justify-center shadow-soft">
            <PawPrint className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-gray-900">创建账户</h1>
          <p className="text-gray-500 mt-2">开始你的萌宠健康之旅</p>
        </div>

        <div className="card">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  role === r.value
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-forest-100 bg-white hover:border-forest-200'
                }`}
              >
                <p className={`font-semibold ${role === r.value ? 'text-forest-700' : 'text-gray-700'}`}>
                  {r.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">昵称</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text">手机号</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  className="input-field pl-12 pr-12"
                  minLength={6}
                  required
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

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-warm w-full !py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">已有账户？</span>
            <Link to="/login" className="text-warm-500 font-medium hover:text-warm-600 ml-1">
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
