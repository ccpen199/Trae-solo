import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login, user, token, mfaChallenge } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      navigate('/dashboard', { replace: true });
    }
    if (mfaChallenge) {
      navigate('/mfa', { replace: true });
    }
  }, [user, token, mfaChallenge, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.mfaRequired) {
        navigate('/mfa');
      } else if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError(err.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>企业安全中台</h1>
          <p>IAM 身份认证与访问管理系统</p>
        </div>
        <div className="login-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !username || !password}
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </div>

            <div className="form-info">
              <p style={{ marginBottom: '8px', fontWeight: '500' }}>演示账号：</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 12px', height: 'auto' }}
                  onClick={() => handleDemoLogin('admin', 'Admin@123456')}
                >
                  管理员
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 12px', height: 'auto' }}
                  onClick={() => handleDemoLogin('employee', 'Employee@123')}
                >
                  员工
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 12px', height: 'auto' }}
                  onClick={() => handleDemoLogin('auditor', 'Auditor@123')}
                >
                  审计员
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
