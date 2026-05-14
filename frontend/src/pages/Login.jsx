import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../store/auth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authAPI.login(form);
      if (res.success) {
        login(res.data.token, res.data);
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = () => {
    const appId = 'wx1234567890';
    const redirectUri = encodeURIComponent(window.location.origin + '/api/auth/wechat-callback');
    const scope = 'snsapi_userinfo';
    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}#wechat_redirect`;
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>登录</h2>

        {error && (
          <div style={{ padding: '12px', background: '#fff2f0', color: '#ff4d4f', borderRadius: '4px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={handleWechatLogin}
            style={{ width: '100%' }}
          >
            微信登录
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
