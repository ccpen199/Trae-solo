import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Button, Card } from '../components/ui';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    role: 'CITIZEN',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (form.password.length < 6) {
      setError('密码至少6位');
      return;
    }
    setLoading(true);
    try {
      await register(form.phone, form.password, form.nickname, form.role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-500/30">
            邻
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">加入邻里圈</h1>
          <p className="text-gray-500">共建温暖的本地社区</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="请输入手机号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => update('nickname', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="给自己取个名字吧"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="至少6位"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="再次输入密码"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">账号类型</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'CITIZEN', l: '市民用户', icon: '👤' },
                  { v: 'MERCHANT', l: '商家入驻', icon: '🏪' },
                  { v: 'GOVERNMENT', l: '政务号', icon: '🏛️' },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => update('role', opt.v)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      form.role === opt.v
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-xs font-medium">{opt.l}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? '注册中...' : '注册并登录'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            已有账号？
            <Link to="/login" className="text-primary-600 font-medium ml-1">
              去登录
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
