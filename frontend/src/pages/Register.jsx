import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...data } = formData;
      await register(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试');
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
        maxWidth: 480,
        padding: 40,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>创建账号</h1>
          <p style={{ color: 'var(--text-muted)' }}>加入 JobMatch，开启职场新旅程</p>
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
            <label className="form-label">账号类型</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{
                flex: 1,
                padding: 16,
                border: '2px solid',
                borderColor: formData.role === 'jobseeker' ? 'var(--primary-color)' : 'var(--border-color)',
                borderRadius: 8,
                cursor: 'pointer',
                background: formData.role === 'jobseeker' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              }}>
                <input
                  type="radio"
                  name="role"
                  value="jobseeker"
                  checked={formData.role === 'jobseeker'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontWeight: 500 }}>👤 求职者</span>
              </label>
              <label style={{
                flex: 1,
                padding: 16,
                border: '2px solid',
                borderColor: formData.role === 'hr' ? 'var(--primary-color)' : 'var(--border-color)',
                borderRadius: 8,
                cursor: 'pointer',
                background: formData.role === 'hr' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              }}>
                <input
                  type="radio"
                  name="role"
                  value="hr"
                  checked={formData.role === 'hr'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontWeight: 500 }}>🏢 企业HR</span>
              </label>
            </div>
          </div>

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
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="至少6位"
                required
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
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          已有账号？<Link to="/login" className="text-primary font-medium">立即登录</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
