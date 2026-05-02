import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useAuth } from '../App';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await userAPI.login({ username, password });
      if (response.data.success) {
        login(response.data.data);
        if (response.data.data.status !== 'active') {
          navigate('/activate');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.data.error || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '登录失败，请检查网络');
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
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '48px' }}>💰</span>
          <h1 style={{ margin: '10px 0', color: '#333', fontSize: '24px' }}>数字钱包</h1>
          <p style={{ color: '#666' }}>Digital Wallet System</p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#666', margin: 0 }}>
            还没有账户？{' '}
            <Link to="/register" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              立即注册
            </Link>
          </p>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f7fa', borderRadius: '6px', fontSize: '13px', color: '#666' }}>
          <p style={{ margin: '0 0 8px 0' }}><strong>测试账号：</strong></p>
          <p style={{ margin: '4px 0' }}>管理员: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
