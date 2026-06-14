import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../utils/api.js';

function LoginPage({ onLogin, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const from = location.state?.from || '/';
  const requiredRole = location.state?.requiredRole;

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const testAccounts = [
    { role: 'jobseeker', label: '求职者', phone: '13800138000', password: '123456', name: '张三' },
    { role: 'employer', label: '企业', phone: '13900139000', password: '123456', name: '上海华成制造' },
    { role: 'admin', label: '管理员', phone: 'admin', password: 'admin123456', name: '管理员' }
  ];

  const selectAccount = (account) => {
    setPhone(account.phone);
    setPassword(account.password);
    setSelectedRole(account.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { phone, password });
      onLogin(res.data.token, res.data.user);
      
      if (requiredRole && res.data.user.role !== requiredRole) {
        setError(`此功能需要${requiredRole === 'jobseeker' ? '求职者' : requiredRole === 'employer' ? '企业' : '管理员'}身份登录`);
        setLoading(false);
        return;
      }

      const targetPath = location.state?.from || (
        res.data.user.role === 'jobseeker' ? '/jobs' :
        res.data.user.role === 'employer' ? '/employer' :
        '/admin'
      );
      navigate(targetPath, { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '40px 20px' }}>
      <div className="card">
        <h2 className="page-title text-center" style={{ marginBottom: '12px' }}>账号登录</h2>
        <p className="text-secondary text-center" style={{ marginBottom: '24px' }}>
          {requiredRole === 'jobseeker' ? '投递岗位需要求职者身份' :
           requiredRole === 'employer' ? '管理岗位需要企业身份' :
           '选择您的身份类型'}
        </p>
        
        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ marginBottom: '20px' }}>
          <div className="text-sm text-secondary" style={{ marginBottom: '8px' }}>快速选择测试账号：</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {testAccounts.map(acc => (
              <button
                key={acc.role}
                type="button"
                className={`btn btn-sm ${selectedRole === acc.role ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => selectAccount(acc)}
                style={{ flex: 1 }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">手机号/账号</label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号或账号"
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

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span className="text-secondary">还没有账号？</span>
          <Link to="/register" style={{ color: 'var(--primary-color)' }}>立即注册</Link>
        </div>

        {selectedRole && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
            <div className="text-sm" style={{ color: '#1890ff' }}>
              ✨ 已选择：{testAccounts.find(a => a.role === selectedRole)?.name}
              <br />
              <span className="text-secondary">点击登录按钮即可体验</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
