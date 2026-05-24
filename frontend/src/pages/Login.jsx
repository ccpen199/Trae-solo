import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: '系统管理员' },
    { username: 'operator', password: 'operator123', role: '运营人员' },
    { username: 'cs1', password: 'cs123', role: '客服' },
    { username: 'venue1', password: 'venue123', role: '场馆经理' },
    { username: 'organizer1', password: 'org123', role: '组织者' },
    { username: 'user1', password: 'user123', role: '普通用户' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  const quickLogin = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>🎾 在线约球平台</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            登录
          </button>
        </form>
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', color: '#718096', marginBottom: '10px' }}>演示账号：</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {demoAccounts.map((acc, idx) => (
              <span
                key={idx}
                className="badge info"
                style={{ cursor: 'pointer' }}
                onClick={() => quickLogin(acc)}
              >
                {acc.username}/{acc.role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
