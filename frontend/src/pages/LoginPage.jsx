import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginType, setLoginType] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
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
      await authApi.sendCode(formData.phone, 'login');
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

    try {
      if (loginType === 'code') {
        await authApi.verifyCode(formData.phone, formData.code, 'login');
        await login({ phone: formData.phone, code: formData.code });
      } else {
        await login({ phone: formData.phone, password: formData.password });
      }
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
          <h1 className="form-title">欢迎回来</h1>
          <p className="form-subtitle">登录您的云会议账号</p>

          <div style={{
            padding: '12px 16px',
            background: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#2e7d32',
          }}>
            🎯 测试账号：<strong>13800000000</strong> / 密码：<strong>123456</strong><br/>
            💡 验证码登录：固定验证码为 <strong>123456</strong>
          </div>

          <div className="tabs">
            <button
              className={`tab ${loginType === 'password' ? 'active' : ''}`}
              onClick={() => setLoginType('password')}
            >
              密码登录
            </button>
            <button
              className={`tab ${loginType === 'code' ? 'active' : ''}`}
              onClick={() => setLoginType('code')}
            >
              验证码登录
            </button>
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

            {loginType === 'password' ? (
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
            ) : (
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
            )}

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="form-footer">
            还没有账号？<Link to="/register">立即注册</Link>
            <br />
            <Link to="/reset-password">忘记密码？</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
