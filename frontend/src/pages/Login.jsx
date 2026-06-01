import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testMsg, setTestMsg] = useState('点击按钮测试');

  const handleTestClick = () => {
    setTestMsg('按钮点击成功！时间: ' + new Date().toLocaleTimeString());
    console.log('Button clicked!');
  };

  const handleLogin = async () => {
    setTestMsg('正在登录...');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.token) {
        setTestMsg('登录成功！');
        onLogin(data.user, data.token);
      } else {
        setError(data.error || '登录失败');
        setTestMsg('登录失败');
      }
    } catch (err) {
      setError(err.message);
      setTestMsg('请求错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        width: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>数据库迁移工具</h2>
        
        <div style={{ marginBottom: '16px', padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
          {testMsg}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

        <button
          onClick={handleTestClick}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
            background: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          测试点击
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#999' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          <p>测试账号：admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
