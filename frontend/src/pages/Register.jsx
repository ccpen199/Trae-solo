import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState('');
  const { register, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, clearError]);

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return false;
    }
    if (formData.password.length < 6) {
      setLocalError('密码长度至少6位');
      return false;
    }
    if (formData.username.length < 3) {
      setLocalError('用户名长度至少3位');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await register(formData.username, formData.email, formData.password);
      navigate('/');
    } catch (err) {
      console.error('Register failed:', err);
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
          创建账号
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: '32px'
        }}>
          加入 CineHub 社区
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="至少3个字符"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="至少6个字符"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              className="form-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="再次输入密码"
              required
              autoComplete="new-password"
            />
          </div>

          {(error || localError) && (
            <div className="error" style={{ textAlign: 'center', marginBottom: '16px' }}>
              {localError || error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            注册
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          已有账号？
          <Link to="/login" style={{ color: 'var(--primary)', marginLeft: '4px' }}>
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
