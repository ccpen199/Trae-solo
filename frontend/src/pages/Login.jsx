import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api.js';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      const respData = response.data?.data || response.data;
      const { user, token } = respData;
      if (!user) {
        throw new Error('登录响应格式错误');
      }
      localStorage.setItem('user', JSON.stringify(user));
      if (token) {
        localStorage.setItem('token', token);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || '登录失败，请检查用户名和密码';
      setError(errorMsg);
      console.error('登录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">家庭教育咨询管理系统</h1>
        <p className="login-subtitle">请登录您的账户</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-hint">
          <strong>测试账号：</strong>
          <br />
          运营管理员：admin / admin123
          <br />
          督导：supervisor1 / 123456
          <br />
          咨询师：consultant1 / 123456
          <br />
          家长：parent1 / 123456
        </div>
      </div>
    </div>
  );
};

export default Login;
