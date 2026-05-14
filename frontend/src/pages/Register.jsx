import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../store/auth';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.register({
        username: form.username,
        password: form.password,
        phone: form.phone
      });
      if (res.success) {
        login(res.data.token, { id: res.data.userId, username: res.data.username });
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>注册</h2>

        {error && (
          <div style={{ padding: '12px', background: '#fff2f0', color: '#ff4d4f', borderRadius: '4px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入手机号（选填）"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              className="input"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="请再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          已有账号？<Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
