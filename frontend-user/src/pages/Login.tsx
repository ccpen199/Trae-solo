import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../api/modules';
import { useToast, useUser } from '../App';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const toast = useToast();
  const { setUser } = useUser();
  const [form, setForm] = useState({ phone: '13800138001', password: '123456' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.phone || !form.password) return toast.show('请填写完整信息', 'error');
    setLoading(true);
    try {
      const res: any = await authApi.login(form);
      if (res.success) {
        localStorage.setItem('user_token', res.data.token);
        localStorage.setItem('user_info', JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.show('登录成功', 'success');
        setTimeout(() => {
          navigate(location.state?.from || '/');
        }, 500);
      }
    } catch (e: any) {
      toast.show(e.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ padding: '80px 24px 24px' }}>
        <div style={{ color: 'white', marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>欢迎回来 👋</div>
          <div style={{ opacity: 0.85 }}>登录后立即享受极速充值服务</div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input className="form-input" placeholder="请输入手机号"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="form-input" type="password" placeholder="请输入密码"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <button className="btn-primary btn-block mt-16" onClick={submit} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', color: '#666', fontSize: 13 }}>
            还没有账号？<Link to="/register" style={{ color: '#667eea', fontWeight: 600 }}>立即注册</Link>
          </div>

          <div style={{ marginTop: 20, padding: 12, background: '#f5f7ff', borderRadius: 10, fontSize: 12, color: '#667eea' }}>
            💡 测试账号: 13800138001 ~ 13800138008，密码: 123456
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          200+ 商品 · 官方直充 · 安全保障
        </div>
      </div>
    </div>
  );
}
