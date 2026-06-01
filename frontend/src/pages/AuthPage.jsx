import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

function AuthPage() {
  const [tab, setTab] = useState('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [userType, setUserType] = useState('c');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login, register, showToast, user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      handleRoleRedirect();
    }
  }, [user]);

  const handleRoleRedirect = () => {
    const u = user || { user_type: userType };
    let target = from;
    if (from === '/' || from === '/auth') {
      if (u.user_type === 'admin') target = '/admin';
      else if (u.user_type === 'b') target = '/merchant';
      else target = '/';
    }
    navigate(target, { replace: true });
  };

  const validate = () => {
    const err = {};
    if (!phone.trim()) err.phone = '请输入手机号';
    else if (!/^1\d{10}$/.test(phone.trim())) err.phone = '手机号格式不正确';
    if (!password) err.password = '请输入密码';
    else if (password.length < 6) err.password = '密码至少6位';
    if (tab === 'register') {
      if (!nickname.trim()) err.nickname = '请输入昵称';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (tab === 'login') {
        const res = await login(phone, password);
        showToast('登录成功');
        setTimeout(() => handleRoleRedirect(), 300);
      } else {
        await register(phone, password, nickname, userType);
        showToast('注册成功');
        setTimeout(() => handleRoleRedirect(), 300);
      }
    } catch (err) {
      const msg = err.response?.data?.error || '操作失败';
      if (msg.includes('密码') || msg.includes('password')) setErrors({ password: msg });
      else if (msg.includes('手机号') || msg.includes('phone')) setErrors({ phone: msg });
      else showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h2 className="form-title">{tab === 'login' ? '登录本地信息平台' : '注册本地信息平台'}</h2>

      {from !== '/' && (
        <div style={{ background: '#e6f7ff', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#1890ff' }}>
          🔐 登录后将继续前往 <b>{from === '/publish' ? '发布信息' : from === '/merchant' ? '商家中心' : from === '/admin' ? '管理后台' : from}</b>
        </div>
      )}

      <div className="auth-tabs">
        <div className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErrors({}); }}>登录</div>
        <div className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErrors({}); }}>注册</div>
      </div>

      {tab === 'register' && (
        <div style={{ background: '#f6ffed', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
          💡 <b>选择用户类型：</b>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 10px', background: userType === 'c' ? '#1890ff' : '#fff', color: userType === 'c' ? '#fff' : '#666', borderRadius: 4, cursor: 'pointer' }} onClick={() => setUserType('c')}>👤 个人用户 - 浏览、发布、联系</span>
            <span style={{ padding: '4px 10px', background: userType === 'b' ? '#722ed1' : '#fff', color: userType === 'b' ? '#fff' : '#666', borderRadius: 4, cursor: 'pointer' }} onClick={() => setUserType('b')}>🏪 商家用户 - 线索接收、商家认证</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {tab === 'register' && (
          <div className="form-group">
            <label className="form-label">昵称 *</label>
            <input
              type="text"
              className={`form-input ${errors.nickname ? 'error' : ''}`}
              value={nickname}
              onChange={e => { setNickname(e.target.value); if (errors.nickname) setErrors(p => ({ ...p, nickname: '' })); }}
              placeholder="请输入您的昵称"
            />
            {errors.nickname && <div className="form-error">{errors.nickname}</div>}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">手机号 *</label>
          <input
            type="tel"
            className={`form-input ${errors.phone ? 'error' : ''}`}
            value={phone}
            onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
            placeholder="请输入11位手机号"
            maxLength={11}
          />
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">密码 *</label>
          <input
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            value={password}
            onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
            placeholder="请输入6位以上密码"
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: 14, fontSize: 16, marginTop: 8 }}
          disabled={submitting}
        >
          {submitting ? '处理中...' : tab === 'login' ? '登录' : '注册'}
        </button>
      </form>

      <div style={{ marginTop: 20, padding: 16, background: '#fafafa', borderRadius: 8, fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#666' }}>🎯 登录后可使用：</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>📝 发布信息</div>
          <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>❤️ 收藏管理</div>
          <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>🕐 浏览足迹</div>
          <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>🚩 举报工单</div>
          <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>💬 线索分发</div>
          <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>🏪 商家认证</div>
        </div>

        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#666' }}>📱 测试账号：</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setPhone('13800138000'); setPassword('admin123456'); setTab('login'); }}
              style={{ padding: '6px 12px', border: '1px solid #ff4d4f', color: '#ff4d4f', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
            >
              ⚡ 管理员登录
            </button>
            <div style={{ padding: 6, fontSize: 12, color: '#999' }}>
              管理员: 13800138000 / admin123456 → 后台复查 / 工单管理 / 举报处理
            </div>
          </div>
        </div>
      </div>

      {tab === 'login' && (
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
          还没有账号？
          <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => setTab('register')}>立即注册 →</span>
        </div>
      )}
      {tab === 'register' && (
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
          已有账号？
          <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => setTab('login')}>去登录 →</span>
        </div>
      )}
    </div>
  );
}

export default AuthPage;
