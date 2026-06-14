import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { setAuth } from '../utils/auth';
import { useApp } from '../contexts/AppContext';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: searchParams.get('role') || 'jobseeker',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const { confirmPassword, ...submitData } = formData;
      const response = await api.post('/auth/register', submitData);
      const { token, user } = response.data;
      setAuth(token, user);
      setUser(user);
      
      if (user.role === 'company') {
        navigate('/company');
      } else {
        navigate('/jobseeker');
      }
    } catch (error) {
      setError(error.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
      padding: '20px',
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #00897b, #00695c)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '16px',
          }}>
            琼
          </div>
          <h2 style={{ marginBottom: '8px' }}>创建账号</h2>
          <p className="text-secondary">加入海南自贸港特色岗位撮合平台</p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'role', value: 'jobseeker' } })}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid ' + (formData.role === 'jobseeker' ? '#00897b' : '#e0e0e0'),
              background: formData.role === 'jobseeker' ? '#e0f2f1' : 'white',
              color: formData.role === 'jobseeker' ? '#00695c' : '#616161',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontWeight: '600' }}>我是求职者</div>
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'role', value: 'company' } })}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid ' + (formData.role === 'company' ? '#00897b' : '#e0e0e0'),
              background: formData.role === 'company' ? '#e0f2f1' : 'white',
              color: formData.role === 'company' ? '#00695c' : '#616161',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏢</div>
            <div style={{ fontWeight: '600' }}>我是企业</div>
          </button>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {formData.role === 'company' ? '企业名称' : '姓名'}
              <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={formData.role === 'company' ? '请输入企业名称' : '请输入您的姓名'}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">邮箱地址<span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱地址"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号码</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入手机号码"
              className="form-input"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">设置密码<span className="required">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="至少6位字符"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">确认密码<span className="required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="再次输入密码"
                className="form-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="divider"></div>

        <div style={{ textAlign: 'center' }}>
          <p className="text-sm text-secondary">
            已有账号？
            <Link to="/login" className="text-primary ml-sm">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
