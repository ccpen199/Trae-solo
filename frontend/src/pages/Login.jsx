import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../App';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nickname: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert('请填写用户名和密码');
      return;
    }

    try {
      setLoading(true);
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await api.post(endpoint, formData);

      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>{isRegister ? '注册' : '登录'}</div>
        <div style={{ width: 40 }}></div>
      </header>

      <main className="content" style={{ maxWidth: 400, margin: '40px auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">昵称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="form-submit"
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)' }}>
            {isRegister ? '已有账号？' : '还没有账号？'}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>演示账号</p>
            <p style={{ fontSize: '14px' }}>用户名: demo / 密码: 123456</p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Login;
