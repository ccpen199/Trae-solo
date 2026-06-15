import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const { setAdmin, showToast } = useApp();
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.username || !form.password) return showToast('请填写账号密码', 'error');
    setLoading(true);
    try {
      const res: any = await api.post('/auth/admin-login', form);
      if (res.success) {
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('admin_info', JSON.stringify(res.data.user));
        setAdmin(res.data.user);
        showToast('登录成功', 'success');
        setTimeout(() => navigate('/'), 400);
      }
    } catch (e: any) {
      showToast(e.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, marginBottom: 16, boxShadow: '0 10px 30px rgba(99,102,241,0.4)'
          }}>💎</div>
          <div className="login-title">虚拟商品管理平台</div>
          <div className="login-subtitle">Virtual Goods Platform · Admin Console</div>
        </div>

        <div className="form-row">
          <label className="form-label">管理员账号</label>
          <input className="form-input" placeholder="请输入管理员账号" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div className="form-row">
          <label className="form-label">登录密码</label>
          <input className="form-input" type="password" placeholder="请输入密码" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <button className="btn btn-primary" style={{
          width: '100%', padding: '12px', fontSize: 15, marginTop: 8
        }} onClick={submit} disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </button>
        <div style={{
          marginTop: 24, padding: 12, background: '#eef2ff',
          borderRadius: 10, fontSize: 12, color: '#6366f1', textAlign: 'center'
        }}>
          🔐 默认账号：admin / admin123
        </div>
      </div>
    </div>
  );
}
