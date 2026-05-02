import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      const { token, user } = response.data;
      setAuth(token, user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <div className="card" style={{ maxWidth: '450px', margin: '0 auto' }}>
        <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '32px' }}>
          🔐 登录游戏
        </h2>

        <form onSubmit={handleSubmit}>
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

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p style={{ textAlign: 'center', color: '#718096', fontSize: '0.875rem' }}>
            还没有账号？
            <Link to="/register" style={{ color: '#667eea', marginLeft: '4px' }}>
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
