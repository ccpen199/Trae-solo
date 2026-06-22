import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'homeowner' as UserRole
  });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    }
  };

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">创建账号</h2>
      <p className="text-gray-500 mb-6">加入装修之家，开启您的装修之旅</p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {(['homeowner', 'designer'] as UserRole[]).map(role => (
          <button
            key={role}
            type="button"
            onClick={() => update('role', role)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              form.role === role
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-sm text-gray-900">
              {role === 'homeowner' ? '🏠 我是业主' : '🎨 我是设计师'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {role === 'homeowner' ? '发布日记、找设计师' : '入驻接单、展示作品'}
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input value={form.username} onChange={e => update('username', e.target.value)} className="input" placeholder="3-20字符" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input" placeholder="请输入手机号" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input" placeholder="your@email.com" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input" placeholder="至少6位" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className="input" required />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full btn-primary" disabled={isLoading}>
          {isLoading ? '注册中...' : '注册账号'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        已有账号？{' '}
        <Link to="/auth/login" className="text-primary-700 font-medium hover:text-primary-800">
          立即登录
        </Link>
      </p>
    </div>
  );
}
