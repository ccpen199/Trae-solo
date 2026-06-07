
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store.js';
import { authAPI } from '../api.js';

const demoAccounts = [
  { label: '求职者进入职位/内推', username: 'jobseeker1', password: '123456', target: '/jobs' },
  { label: '企业进入发布/入职', username: 'employer1', password: '123456', target: '/post-job' },
  { label: '管理员进入管理后台', username: 'admin', password: '123456', target: '/admin' }
];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('jobseeker');
  const [form, setForm] = useState({
    username: 'jobseeker1',
    phone: '',
    password: '123456',
    wechat_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);

  const { setToken, setUser, token } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const finishLogin = (res, target) => {
    if (res.data?.token && res.data?.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(target || getRoleDashboard(res.data.user.role), { replace: true });
      return true;
    }
    return false;
  };

  const getRoleDashboard = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'employer':
        return '/companies';
      case 'jobseeker':
        return '/jobs';
      default:
        return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        if (!form.username.trim()) {
          setError('请输入用户名');
          setLoading(false);
          return;
        }
        if (!form.password) {
          setError('请输入密码');
          setLoading(false);
          return;
        }
        res = await authAPI.login({
          username: form.username.trim(),
          password: form.password
        });
      } else {
        if (!form.username.trim()) {
          setError('请输入用户名');
          setLoading(false);
          return;
        }
        if (!form.phone.trim()) {
          setError('请输入手机号');
          setLoading(false);
          return;
        }
        if (!form.password) {
          setError('请输入密码');
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          setError('密码长度至少6位');
          setLoading(false);
          return;
        }
        res = await authAPI.register({
          ...form,
          username: form.username.trim(),
          phone: form.phone.trim(),
          wechat_id: form.wechat_id?.trim() || '',
          role
        });
      }

      if (res.data?.token && res.data?.user) {
        const role = res.data.user.role;
        const dashboard = from === '/' ? getRoleDashboard(role) : from;
        setTimeout(() => {
          finishLogin(res, dashboard);
        }, 300);
      } else {
        setError('登录失败：服务器返回数据格式错误');
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || '操作失败，请重试';
      if (errorMsg.includes('401') || errorMsg.includes('密码') || errorMsg.includes('不存在')) {
        setError(`登录失败：${errorMsg}。请检查用户名和密码是否正确，或点击下方"初始化测试数据"按钮。`);
      } else if (errorMsg.includes('429')) {
        setError('登录失败：请求过于频繁，请稍后再试');
      } else {
        setError(`操作失败：${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account) => {
    setMode('login');
    setError('');
    setLoading(true);
    setForm((current) => ({
      ...current,
      username: account.username,
      password: account.password
    }));
    try {
      const res = await authAPI.login({
        username: account.username,
        password: account.password
      });
      if (!finishLogin(res, account.target)) {
        setError('登录失败：服务器返回数据格式错误');
      }
    } catch (e) {
      setError(`快速登录失败：${e.response?.data?.error || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      await authAPI.seed();
      alert('测试数据已初始化！\n\n测试账号：\nadmin / 123456 (管理员)\nemployer1 / 123456 (企业用户)\njobseeker1 / 123456 (求职者)\njobseeker2 / 123456 (求职者)');
    } catch (e) {
      alert('初始化失败：' + (e.response?.data?.error || e.message));
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>🤝 熟人推荐</h1>
          <p>以信任为基底的社区化招聘平台</p>
        </div>

        <div className="login-tabs">
          <div
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            登录
          </div>
          <div
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            注册
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={form.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="请输入手机号"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">微信ID（用于验证推荐关系）</label>
                <input
                  type="text"
                  name="wechat_id"
                  className="form-input"
                  value={form.wechat_id}
                  onChange={handleChange}
                  placeholder="请输入微信ID"
                />
              </div>
              <div className="form-group">
                <label className="form-label">用户类型</label>
                <div className="role-selector">
                  <div
                    className={`role-option ${role === 'jobseeker' ? 'selected' : ''}`}
                    onClick={() => setRole('jobseeker')}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>👤</div>
                    <div>求职者</div>
                  </div>
                  <div
                    className={`role-option ${role === 'employer' ? 'selected' : ''}`}
                    onClick={() => setRole('employer')}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🏢</div>
                    <div>企业用户</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={form.password}
              onChange={handleChange}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                {mode === 'login' ? '登录中...' : '注册中...'}
              </>
            ) : (
              <>{mode === 'login' ? '登录' : '注册'}</>
            )}
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={handleSeed}
            disabled={seedLoading}
          >
            {seedLoading ? '初始化中...' : '🔧 初始化测试数据'}
          </button>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          {demoAccounts.map((account) => (
            <button
              key={account.username}
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin(account)}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {account.label}
            </button>
          ))}
        </div>

        <div className="login-footer">
          {mode === 'login' ? (
            <span>还没有账号？<a onClick={() => setMode('register')}>立即注册</a></span>
          ) : (
            <span>已有账号？<a onClick={() => setMode('login')}>立即登录</a></span>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>
          测试账号：admin/123456 | employer1/123456 | jobseeker1/123456
        </div>
      </div>
    </div>
  );
}
