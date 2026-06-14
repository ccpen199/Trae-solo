import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api.js';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!formData.password.trim()) {
      setError('请输入密码');
      return;
    }
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      
      const role = res.data.user.role;
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'company') {
        navigate('/company/applications');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>🔐 登录</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名 <span className="required">*</span></label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div className="form-group">
          <label>密码 <span className="required">*</span></label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="请输入密码"
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
        还没有账号？<Link to="/register" style={{ color: '#667eea' }}>立即注册</Link>
      </div>
      
      <div className="alert alert-warning" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
        <strong>测试账号：</strong><br />
        管理员：admin / admin123<br />
        企业：company1 / 123456<br />
        求职者：seeker1 / 123456
      </div>
    </div>
  );
}

export default LoginPage;
