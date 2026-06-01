import React, { useState } from 'react';
import { authAPI } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login({ username, password });
      if (res.data.success) {
        onLogin(res.data.user);
      } else {
        setError(res.data.error || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">建设工程变更签证系统</h2>
        <p className="login-subtitle">请登录您的账号</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
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
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
          <div style={{ marginBottom: '8px', fontWeight: '500' }}>测试账号：</div>
          <div>admin / admin123 (系统管理员)</div>
          <div>construction / 123456 (施工单位)</div>
          <div>supervision / 123456 (监理单位)</div>
          <div>owner / 123456 (业主方)</div>
          <div>cost / 123456 (成本部门)</div>
        </div>
      </div>
    </div>
  );
}

export default Login;
