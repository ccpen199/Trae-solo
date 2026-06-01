import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);

  const [formData, setFormData] = useState({
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    code: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendCode = async () => {
    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }
    try {
      await authApi.sendCode(formData.phone, 'register');
      setCodeCountdown(60);
      const timer = setInterval(() => {
        setCodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      await authApi.verifyCode(formData.phone, formData.code, 'register');
      await register({
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
        code: formData.code,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="form-container">
        <div className="card">
          <h1 className="form-title">创建账号</h1>
          <p className="form-subtitle">注册您的云会议账号</p>

          <div className="form-tip" style={{
            padding: '12px 16px',
            background: '#e3f2fd',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#1976d2',
          }}>
            💡 提示：测试环境验证码固定为 <strong>123456</strong>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input
                type="tel"
                name="phone"
                className="input"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                type="text"
                name="username"
                className="input"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">验证码</label>
              <div className="code-input-group">
                <input
                  type="text"
                  name="code"
                  className="input"
                  placeholder="请输入验证码"
                  value={formData.code}
                  onChange={handleChange}
                  maxLength={6}
                />
                <button
                  type="button"
                  className="btn btn-secondary code-btn"
                  onClick={handleSendCode}
                  disabled={codeCountdown > 0 || loading}
                >
                  {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">确认密码</label>
              <input
                type="password"
                name="confirmPassword"
                className="input"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="form-footer">
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
