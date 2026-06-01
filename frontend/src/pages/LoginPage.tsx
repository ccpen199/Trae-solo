import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username.trim()) {
      setError('请输入用户名');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('请输入密码');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      
      setSuccess('登录成功，正在跳转...');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
      
    } catch (err: any) {
      console.error('Auth error:', err);
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 401) {
          setError(data?.error || '用户名或密码错误，请重试');
        } else if (status === 400) {
          setError(data?.error || '请求参数错误');
        } else if (status === 409) {
          setError(data?.error || '用户名已存在');
        } else if (status === 500) {
          setError('服务器错误，请稍后重试');
        } else {
          setError(data?.error || `请求失败 (${status})`);
        }
      } else if (err.request) {
        setError('网络连接失败，请检查后端服务是否启动');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('操作失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setSuccess('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <h1 className="login-title">智能家居管理平台</h1>
          <p className="login-subtitle">统一管理您的智能硬件设备</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#fef2f2', 
            color: '#dc2626', 
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #fecaca'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#f0fdf4', 
            color: '#16a34a', 
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #bbf7d0'
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '16px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                处理中...
              </span>
            ) : (
              <span>{isLogin ? '登 录' : '注 册'}</span>
            )}
          </button>
        </form>

        <div className="toggle-link">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            disabled={loading}
            style={{ border: 'none', background: 'none', color: '#10b981', cursor: 'pointer', fontSize: '14px' }}
          >
            {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
          <div style={{ fontWeight: '600', marginBottom: '12px', color: '#334155', fontSize: '13px' }}>
            🔑 演示账号（点击快速填充）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={() => fillDemoAccount('admin', 'admin123')} 
              disabled={loading}
              style={{ padding: '8px', textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              <div style={{ fontWeight: '500', color: '#1e293b' }}>管理员</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>admin / admin123</div>
            </button>
            <button 
              onClick={() => fillDemoAccount('platform', 'platform123')} 
              disabled={loading}
              style={{ padding: '8px', textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              <div style={{ fontWeight: '500', color: '#1e293b' }}>平台管理员</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>platform / platform123</div>
            </button>
            <button 
              onClick={() => fillDemoAccount('ops', 'ops123')} 
              disabled={loading}
              style={{ padding: '8px', textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              <div style={{ fontWeight: '500', color: '#1e293b' }}>运维管理员</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>ops / ops123</div>
            </button>
            <button 
              onClick={() => fillDemoAccount('user1', 'user123')} 
              disabled={loading}
              style={{ padding: '8px', textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              <div style={{ fontWeight: '500', color: '#1e293b' }}>普通用户</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>user1 / user123</div>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
