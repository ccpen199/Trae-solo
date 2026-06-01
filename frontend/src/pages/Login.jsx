import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data.success) {
        onLogin(res.data.user);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('登录失败，请重试');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>校园缴费系统</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary">登录</button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
          <p>测试账号：</p>
          <p>财务：finance / finance123</p>
          <p>班主任：teacher1 / teacher123</p>
          <p>家长：parent1 / parent123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
