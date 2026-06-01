import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      padding: 20,
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 420,
        padding: 40,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>JobMatch</h1>
          <p style={{ color: 'var(--text-muted)' }}>职场即时匹配平台</p>
        </div>

        {error && (
          <div style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger-color)',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

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
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          fontSize: 13,
        }}>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>测试账号：</p>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>管理员：<code>admin / 123456</code></div>
            <div>HR：<code>hr_tech / 123456</code></div>
            <div>求职者：<code>zhangsan / 123456</code></div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          还没有账号？<Link to="/register" className="text-primary font-medium">立即注册</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
