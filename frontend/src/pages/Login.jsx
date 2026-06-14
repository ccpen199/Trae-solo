import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { setAuth } from '../utils/auth';
import { useApp } from '../contexts/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      setAuth(token, user);
      setUser(user);
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'company') {
        navigate('/company');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.error || '登录失败，请重试');
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
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '40px' }}>
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
          <h2 style={{ marginBottom: '8px' }}>欢迎回来</h2>
          <p className="text-secondary">登录海南自贸港特色岗位撮合平台</p>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邮箱地址</label>
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
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="divider"></div>

        <div style={{ textAlign: 'center' }}>
          <p className="text-sm text-secondary">
            还没有账号？
            <Link to="/register" className="text-primary ml-sm">立即注册</Link>
          </p>
        </div>

        <div className="divider"></div>

        <div className="text-xs text-secondary" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '8px' }}>测试账号：</p>
          <p>求职者：wangming@example.com / jobseeker123</p>
          <p>企业：hr@hainan-yacht.com / company123</p>
          <p>管理后台管理员：admin@hainan-ftz.gov.cn / admin123</p>
        </div>
      </div>
    </div>
  );
}
