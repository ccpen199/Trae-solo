import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      document.cookie = 'isLoggedIn=true; path=/';
      alert('登录成功！');
      navigate('/');
    } else {
      alert('请输入用户名和密码');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>用户登录</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              className="city-input"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>密码</label>
            <input
              type="password"
              className="city-input"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn" style={{ marginTop: '20px', width: '100%' }}>
            登录
          </button>
        </form>
        <Link to="/" className="back-link">← 返回首页</Link>
      </div>
    </div>
  );
}

export default LoginPage;
