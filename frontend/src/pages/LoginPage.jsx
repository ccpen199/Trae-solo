import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authApi } from '../api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(username, password);
      const { token, user } = response.data;
      
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register(username, password, name);
      
      const loginResponse = await authApi.login(username, password);
      const { token, user } = loginResponse.data;
      
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    const accounts = {
      investor: { username: 'investor1', password: '123456' },
      risk: { username: 'risk_officer', password: '123456' },
      admin: { username: 'exchange_admin', password: '123456' },
      financial: { username: 'financial_settler', password: '123456' }
    };

    const account = accounts[role];
    if (account) {
      setUsername(account.username);
      setPassword(account.password);
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
        maxWidth: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>证券行情交易系统</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            {isRegistering ? '注册新账户' : '登录您的账户'}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c00', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入您的姓名"
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
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
            {loading ? '处理中...' : (isRegistering ? '注册' : '登录')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            {isRegistering ? '已有账户？立即登录' : '没有账户？立即注册'}
          </button>
        </div>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '12px', textAlign: 'center' }}>
            快速登录演示账户：
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => quickLogin('investor')}
              style={{ padding: '8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}
            >
              投资者
            </button>
            <button
              onClick={() => quickLogin('risk')}
              style={{ padding: '8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}
            >
              风控官
            </button>
            <button
              onClick={() => quickLogin('admin')}
              style={{ padding: '8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}
            >
              管理员
            </button>
            <button
              onClick={() => quickLogin('financial')}
              style={{ padding: '8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}
            >
              财务
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
            所有演示账户密码均为：123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
