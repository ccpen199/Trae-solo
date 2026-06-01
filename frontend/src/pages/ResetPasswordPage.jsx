import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
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
      await authApi.sendCode(formData.phone, 'reset');
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

    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      await authApi.verifyCode(formData.phone, formData.code, 'reset');
      await authApi.resetPassword({
        phone: formData.phone,
        code: formData.code,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page">
        <div className="form-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
            <h2 style={{ marginBottom: '12px' }}>密码重置成功</h2>
            <p style={{ color: '#6b7280' }}>即将跳转到登录页面...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="form-container">
        <div className="card">
          <h1 className="form-title">重置密码</h1>
          <p className="form-subtitle">输入手机号验证后设置新密码</p>

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
              <label className="form-label">新密码</label>
              <input
                type="password"
                name="newPassword"
                className="input"
                placeholder="请输入新密码"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input
                type="password"
                name="confirmPassword"
                className="input"
                placeholder="请再次输入新密码"
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
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>

          <div className="form-footer">
            <Link to="/login">返回登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
