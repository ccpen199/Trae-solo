import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const { login, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password);
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', padding: '64px 24px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          欢迎回来
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: '32px'
        }}>
          登录您的 CineHub 账号
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="请输入用户名"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error" style={{ textAlign: 'center', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            登录
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'var(--bg-dark)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: '500', color: 'var(--text-primary)' }}>
            演示账号：
          </p>
          <p style={{ margin: '4px 0' }}>管理员：<code>admin / admin123</code></p>
          <p style={{ margin: '4px 0' }}>审核员：<code>moderator / mod123</code></p>
          <p style={{ margin: '4px 0' }}>普通用户：<code>user1 / user123</code></p>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          还没有账号？
          <Link to="/register" style={{ color: 'var(--primary)', marginLeft: '4px' }}>
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
