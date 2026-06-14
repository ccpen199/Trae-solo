import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api.js';

function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'seeker',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await authAPI.register({
        username: formData.username,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        phone: formData.phone
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>📝 注册</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>注册身份 <span className="required">*</span></label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="role"
                value="seeker"
                checked={formData.role === 'seeker'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
              👤 求职者
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="role"
                value="company"
                checked={formData.role === 'company'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
              🏢 企业
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>{formData.role === 'seeker' ? '真实姓名' : '企业名称'} <span className="required">*</span></label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={formData.role === 'seeker' ? '请输入您的姓名' : '请输入企业名称'}
            required
          />
        </div>
        
        <div className="form-group">
          <label>手机号 <span className="required">*</span></label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="请输入手机号"
            required
          />
        </div>
        
        <div className="form-group">
          <label>用户名 <span className="required">*</span></label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="请设置登录用户名"
            required
          />
        </div>
        
        <div className="grid-2">
          <div className="form-group">
            <label>密码 <span className="required">*</span></label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="至少6位"
              required
            />
          </div>
          <div className="form-group">
            <label>确认密码 <span className="required">*</span></label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="再次输入密码"
              required
            />
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
        已有账号？<Link to="/login" style={{ color: '#667eea' }}>立即登录</Link>
      </div>
    </div>
  );
}

export default RegisterPage;
