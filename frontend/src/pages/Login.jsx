import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState('code');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSendCode = async () => {
    if (!phone && !email) {
      setError('请输入手机号或邮箱');
      return;
    }
    try {
      setLoading(true);
      const res = await authAPI.sendCode({ phone, email });
      setSentCode(res.data.code);
      setError(`验证码已发送: ${res.data.code}`);
    } catch (e) {
      setError(e.response?.data?.error || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      if (activeTab === 'code') {
        await login('code', { phone, code });
      } else if (activeTab === 'password') {
        await login('password', { phone, email, password });
      } else if (activeTab === 'wechat') {
        await login('wechat', { code: 'wechat_code' });
      } else if (activeTab === 'sso') {
        await login('sso', { enterprise: 'company', token: 'sso_token' });
      }
    } catch (e) {
      setError(e.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await register({ phone, email, password, code, name });
    } catch (e) {
      setError(e.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-md w-full">
        <h1 className="title text-center">云会议协作平台</h1>
        <p className="subtitle text-center">随时随地，高效协作</p>

        <div className="tabs">
          <div className={`tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>验证码登录</div>
          <div className={`tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>密码登录</div>
          <div className={`tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>注册</div>
        </div>

        {error && <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

        {activeTab === 'code' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="label">手机号</label>
              <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" />
            </div>
            <div className="form-group">
              <label className="label">验证码</label>
              <div className="flex gap-2">
                <input type="text" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入验证码" />
                <button type="button" className="btn btn-secondary" onClick={handleSendCode} disabled={loading}>发送</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
            <div className="flex justify-center gap-4 mt-4">
              <span className="link" onClick={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await login('wechat', { code: 'wechat_code' });
                } catch (err) {
                  setError(err.response?.data?.error || '微信登录失败');
                } finally {
                  setLoading(false);
                }
              }}>微信登录</span>
              <span className="link" onClick={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await login('sso', { enterprise: 'company', token: 'sso_token' });
                } catch (err) {
                  setError(err.response?.data?.error || 'SSO登录失败');
                } finally {
                  setLoading(false);
                }
              }}>SSO登录</span>
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="label">手机号/邮箱</label>
              <input type="text" className="input" value={phone || email} onChange={(e) => { const v = e.target.value; if (v.includes('@')) { setEmail(v); setPhone(''); } else { setPhone(v); setEmail(''); } }} placeholder="请输入手机号或邮箱" />
            </div>
            <div className="form-group">
              <label className="label">密码</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="label">姓名</label>
              <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" />
            </div>
            <div className="form-group">
              <label className="label">手机号</label>
              <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" />
            </div>
            <div className="form-group">
              <label className="label">企业邮箱</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入企业邮箱" />
            </div>
            <div className="form-group">
              <label className="label">密码</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请设置密码（至少6位）" />
            </div>
            <div className="form-group">
              <label className="label">验证码</label>
              <div className="flex gap-2">
                <input type="text" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入验证码" />
                <button type="button" className="btn btn-secondary" onClick={handleSendCode} disabled={loading}>发送</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? '注册中...' : '注册'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
