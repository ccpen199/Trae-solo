import { useState } from 'react';
import axios from 'axios';

const testAccounts = [
  { username: 'admin', role: 'admin', roleName: '管理员' },
  { username: 'platform', role: 'platform', roleName: '平台运营' },
  { username: 'ops', role: 'ops', roleName: '运营专员' },
  { username: 'teacher1', role: 'teacher', roleName: '班主任' },
  { username: 'coach1', role: 'coach', roleName: '教练' },
  { username: 'student1', role: 'student', roleName: '学员' },
  { username: 'student2', role: 'student', roleName: '学员' },
  { username: 'student3', role: 'student', roleName: '学员' },
];

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorType('');
    
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      onLogin(res.data.user);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '登录失败，请稍后重试';
      const errType = err.response?.data?.errorType || 'unknown';
      setError(errorMsg);
      setErrorType(errType);
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = async (user) => {
    setUsername(user);
    setPassword('123456');
    setError('');
    setErrorType('');
    
    setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.post('/api/auth/login', { username: user, password: '123456' });
        onLogin(res.data.user);
      } catch (err) {
        const errorMsg = err.response?.data?.error || '登录失败，请稍后重试';
        const errType = err.response?.data?.errorType || 'unknown';
        setError(errorMsg);
        setErrorType(errType);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'user_not_found':
      case 'wrong_password':
      case 'invalid_role':
        return '#f59e0b';
      case 'server_error':
        return '#ef4444';
      default:
        return '#ef4444';
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>训练营打卡</h1>
        <p className="subtitle">欢迎回来，请登录您的账号</p>
        
        {error && (
          <div style={{ 
            color: getErrorColor(), 
            backgroundColor: errorType === 'server_error' ? '#fef2f2' : '#fffbeb',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16, 
            textAlign: 'center',
            fontSize: 14,
            border: `1px solid ${errorType === 'server_error' ? '#fecaca' : '#fde68a'}`
          }}>
            {errorType === 'user_not_found' && '⚠️ '}
            {errorType === 'wrong_password' && '🔑 '}
            {errorType === 'invalid_role' && '🚫 '}
            {errorType === 'server_error' && '❌ '}
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名，如 admin"
              autoComplete="username"
              style={{ borderColor: errorType === 'user_not_found' ? '#f59e0b' : undefined }}
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码，测试账号密码为 123456"
              autoComplete="current-password"
              style={{ borderColor: errorType === 'wrong_password' ? '#f59e0b' : undefined }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: 12 }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
        
        <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
          <p style={{ fontSize: 13, color: '#166534', marginBottom: 12, fontWeight: 500 }}>
            🚀 测试账号（点击下方账号直接登录，密码都是 123456）：
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {testAccounts.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => fillAccount(acc.username)}
                disabled={loading}
                style={{
                  padding: '8px 14px',
                  border: '1px solid #86efac',
                  borderRadius: 8,
                  background: username === acc.username ? '#bbf7d0' : 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.target.style.background = '#dcfce7')}
                onMouseLeave={(e) => !loading && (e.target.style.background = username === acc.username ? '#bbf7d0' : 'white')}
              >
                <span style={{ color: '#166534', fontWeight: 500 }}>{acc.roleName}:</span>
                <span style={{ fontWeight: 700, color: '#15803d', marginLeft: 4 }}>{acc.username}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#166534', marginTop: 10, textAlign: 'center', fontWeight: 500 }}>
            💡 直接点击上方任意账号按钮，即可自动登录并跳转到对应工作台
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
