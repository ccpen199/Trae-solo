import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Login({ showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('请填写用户名和密码', 'error');
      return;
    }
    
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success) {
      showToast('登录成功', 'success');
      const currentUser = useAuthStore.getState().user;
      let redirectPath = '/';
      if (currentUser?.user_type === 'admin') {
        redirectPath = '/admin';
      } else if (currentUser?.user_type === 'employer') {
        redirectPath = '/create-task';
      } else if (['student', 'homemaker', 'parttime'].includes(currentUser?.user_type)) {
        redirectPath = '/tasks';
      }
      navigate(redirectPath);
    } else {
      showToast(result.error || '登录失败', 'error');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '60px 20px' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px' }}>登录账号</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名/手机号/邮箱</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名、手机号或邮箱"
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
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
          还没有账号？<Link to="/register" style={{ color: '#667eea', fontWeight: 500 }}>立即注册</Link>
        </div>
        
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>演示账号</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: '#64748b' }}>
            <div className="card" style={{ padding: '12px', background: '#f8fafc' }}>
              <div style={{ fontWeight: 600, color: '#333' }}>管理员</div>
              <div>admin / admin123</div>
            </div>
            <div className="card" style={{ padding: '12px', background: '#f8fafc' }}>
              <div style={{ fontWeight: 600, color: '#333' }}>企业雇主</div>
              <div>employer_demo / 123456</div>
            </div>
            <div className="card" style={{ padding: '12px', background: '#f8fafc', gridColumn: '1 / -1' }}>
              <div style={{ fontWeight: 600, color: '#333' }}>兼职用户（学生）</div>
              <div>worker_demo / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
