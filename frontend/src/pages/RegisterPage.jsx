import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api.js';

function RegisterPage({ onLogin, user }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('jobseeker');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    contactPerson: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      const endpoint = role === 'jobseeker' ? '/auth/register/jobseeker' : '/auth/register/employer';
      const data = role === 'jobseeker' 
        ? { phone: formData.phone, password: formData.password, name: formData.name }
        : { phone: formData.phone, password: formData.password, companyName: formData.companyName, contactPerson: formData.contactPerson };

      const res = await api.post(endpoint, data);
      onLogin(res.data.token, res.data.user);
      navigate(role === 'jobseeker' ? '/jobseeker' : '/employer');
    } catch (error) {
      setError(error.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', padding: '60px 20px' }}>
      <div className="card">
        <h2 className="page-title text-center" style={{ marginBottom: '32px' }}>注册</h2>

        <div className="tabs" style={{ marginBottom: '24px' }}>
          <div 
            className={`tab-item ${role === 'jobseeker' ? 'active' : ''}`} 
            onClick={() => setRole('jobseeker')}
            style={{ flex: 1, textAlign: 'center' }}
          >
            求职者
          </div>
          <div 
            className={`tab-item ${role === 'employer' ? 'active' : ''}`} 
            onClick={() => setRole('employer')}
            style={{ flex: 1, textAlign: 'center' }}
          >
            企业招聘
          </div>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入手机号"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入密码"
              required
            />
          </div>

          {role === 'jobseeker' ? (
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入您的姓名"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">公司名称</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="请输入公司名称"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">联系人</label>
                <input
                  type="text"
                  name="contactPerson"
                  className="form-input"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="请输入联系人姓名"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span className="text-secondary">已有账号？</span>
          <Link to="/login" style={{ color: 'var(--primary-color)' }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
