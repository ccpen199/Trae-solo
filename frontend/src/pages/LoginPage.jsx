import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      login(response.data.token, response.data.user);
      navigate('/profile');
    } catch (error) {
      setError(error.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingTop: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>欢迎回来</h1>
        <p style={{ color: 'var(--text-secondary)' }}>登录潮汐账号</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ 
            padding: 12, 
            background: '#FEF2F2', 
            color: '#EF4444', 
            borderRadius: 8, 
            marginBottom: 16,
            fontSize: 14 
          }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label>用户名</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="请输入用户名"
            required
          />
        </div>

        <div className="input-group" style={{ marginBottom: 32 }}>
          <label>密码</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="请输入密码"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ fontSize: 16, marginBottom: 20 }}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          还没有账号？
          <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
            立即注册
          </Link>
        </div>
      </form>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link 
          to="/" 
          style={{ 
            color: 'var(--text-secondary)', 
            textDecoration: 'none',
            fontSize: 14 
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
