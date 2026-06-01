import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('登录表单数据:', { username, password });

    try {
      const result = await login(username, password);
      console.log('登录成功:', result);
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
      setError(error.response?.data?.detail || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>登录</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ 
            width: '100%',
            marginTop: '10px'
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
        
        {loading && (
          <div style={{ 
            marginTop: '15px', 
            textAlign: 'center', 
            color: '#3b82f6',
            fontSize: '14px'
          }}>
            正在验证登录信息...
          </div>
        )}
      </form>
      
      <p style={{ marginTop: 20, textAlign: 'center' }}>
        还没有账号？<Link to="/register">立即注册</Link>
      </p>
      
      <div style={{ marginTop: 20, padding: 15, background: '#f3f4f6', borderRadius: 4 }}>
        <p style={{ fontWeight: 'bold', marginBottom: 10 }}>测试账号:</p>
        <p>管理员: admin / admin123</p>
        <p>校园用户: student01 / student123</p>
        <p>社会用户: user01 / user123</p>
      </div>
    </div>
  );
}

export default LoginPage;
