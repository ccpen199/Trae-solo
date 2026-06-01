import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isLogin 
        ? { username, password }
        : { username, password, nickname: nickname || username };

      const res = isLogin 
        ? await authAPI.login(data)
        : await authAPI.register(data);

      login(res.data.token, res.data.user);
      navigate('/home');
    } catch (err) {
      console.error('登录/注册错误:', err);
      const errorMessage = err.response?.data?.error 
        || err.message 
        || (err instanceof Error ? err.message : null)
        || '操作失败，请重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700' }}>箱伴</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>语音直播社交平台</p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '12px', background: '#f5f5f5', padding: '4px' }}>
          <button
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: isLogin ? 'white' : 'transparent', color: isLogin ? '#667eea' : '#999', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => setIsLogin(true)}
          >
            登录
          </button>
          <button
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: !isLogin ? 'white' : 'transparent', color: !isLogin ? '#667eea' : '#999', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}
            onClick={() => setIsLogin(false)}
          >
            注册
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fff0f0', color: '#ff4757', borderRadius: '12px', marginBottom: '16px', fontSize: '14px' }}>
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
              placeholder="请输入用户名"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称（可选）"
              />
            </div>
          )}

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

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
