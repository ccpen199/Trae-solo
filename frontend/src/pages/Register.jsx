import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        username,
        password,
        nickname: nickname || username,
      });
      const { token, user } = response.data;
      setAuth(token, user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <div className="card" style={{ maxWidth: '450px', margin: '0 auto' }}>
        <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '32px' }}>
          🎮 注册账号
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名 *</label>
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
            <label className="form-label">昵称（可选）</label>
            <input
              type="text"
              className="form-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码 *</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">确认密码 *</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
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
            {loading ? '注册中...' : '注册'}
          </button>

          <p style={{ textAlign: 'center', color: '#718096', fontSize: '0.875rem' }}>
            已有账号？
            <Link to="/login" style={{ color: '#667eea', marginLeft: '4px' }}>
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
