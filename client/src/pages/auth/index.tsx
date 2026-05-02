import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">🌍 旅游预订系统</h1>
          <p className="text-gray-500">欢迎回来，请登录您的账户</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="alert alert-error">
                  <p>{error}</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">用户名</label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">密码</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="loading-spinner mr-2"></span>
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                还没有账户？
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                  立即注册
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 card">
          <div className="card-body">
            <h3 className="text-sm font-medium text-gray-700 mb-3">测试账号</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>管理员：</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">admin / admin123</code>
              </div>
              <div className="flex justify-between">
                <span>销售：</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">sales / sales123</code>
              </div>
              <div className="flex justify-between">
                <span>导游：</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">guide / guide123</code>
              </div>
              <div className="flex justify-between">
                <span>游客：</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">tourist / tourist123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email: '',
    role: UserRole.TOURIST,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        role: formData.role,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">🌍 旅游预订系统</h1>
          <p className="text-gray-500">创建新账户</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="alert alert-error">
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                  <label className="form-label">用户名 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="请输入用户名"
                    required
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">姓名 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入真实姓名"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">密码 *</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="请输入密码"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">确认密码 *</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="请再次输入密码"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">手机号</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">邮箱</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">角色类型</label>
                  <select
                    className="select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value={UserRole.TOURIST}>游客</option>
                    <option value={UserRole.SALES}>销售</option>
                    <option value={UserRole.GUIDE}>导游</option>
                    <option value={UserRole.AGENCY}>地接社</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="loading-spinner mr-2"></span>
                    注册中...
                  </span>
                ) : (
                  '注册'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                已有账户？
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
