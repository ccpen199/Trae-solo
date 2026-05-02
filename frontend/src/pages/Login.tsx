import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole, type LoginForm } from '../types';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch {
      // error is handled by store
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const quickLogin = (role: UserRole) => {
    const roleEmails: Record<UserRole, string> = {
      [UserRole.LANDLORD]: 'landlord@example.com',
      [UserRole.GUEST]: 'guest@example.com',
      [UserRole.CLEANER]: 'cleaner@example.com',
      [UserRole.CHANNEL_PLATFORM]: 'channel@example.com',
      [UserRole.ADMIN]: 'admin@example.com',
    };
    setForm({
      email: roleEmails[role],
      password: 'password123',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--gray-50)',
        padding: '1rem',
      }}
    >
      <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--primary-color)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <LogIn size={32} style={{ color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            民宿预订管理系统
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            请登录您的账户
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              color: 'var(--danger-color)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邮箱地址</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={form.email}
              onChange={handleInputChange}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={form.password}
              onChange={handleInputChange}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--gray-500)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            还没有账户？
            <Link
              to="/register"
              style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                marginLeft: '0.25rem',
              }}
            >
              立即注册
            </Link>
          </p>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--gray-50)',
              borderRadius: '0.5rem',
              marginTop: '1rem',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--gray-500)',
                marginBottom: '0.75rem',
              }}
            >
              快捷登录（演示账号）：
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                onClick={() => quickLogin(UserRole.LANDLORD)}
              >
                房东
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                onClick={() => quickLogin(UserRole.GUEST)}
              >
                住客
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                onClick={() => quickLogin(UserRole.CLEANER)}
              >
                保洁
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                onClick={() => quickLogin(UserRole.ADMIN)}
              >
                管理员
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
