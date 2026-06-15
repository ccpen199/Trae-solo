import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/modules';
import { useToast, useUser } from '../App';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const { setUser } = useUser();
  const [form, setForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    referrerCode: params.get('ref') || ''
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.phone || !form.password) return toast.show('请填写手机号和密码', 'error');
    if (form.password !== form.confirmPassword) return toast.show('两次密码不一致', 'error');
    if (!/^1\d{10}$/.test(form.phone)) return toast.show('手机号格式错误', 'error');
    if (form.password.length < 6) return toast.show('密码长度至少6位', 'error');

    setLoading(true);
    try {
      const res: any = await authApi.register({
        phone: form.phone,
        password: form.password,
        nickname: form.nickname,
        referrerCode: form.referrerCode
      });
      if (res.success) {
        localStorage.setItem('user_token', res.data.token);
        localStorage.setItem('user_info', JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.show('注册成功', 'success');
        setTimeout(() => navigate('/'), 500);
      }
    } catch (e: any) {
      toast.show(e.message || '注册失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
      <div style={{ padding: '80px 24px 24px' }}>
        <div style={{ color: 'white', marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>创建账号 🎉</div>
          <div style={{ opacity: 0.85 }}>立即加入，享受首单优惠和分享赚钱</div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input className="form-input" placeholder="请输入手机号"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">昵称（选填）</label>
            <input className="form-input" placeholder="给您起个好听的名字吧"
              value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="form-input" type="password" placeholder="至少6位"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input className="form-input" type="password" placeholder="再次输入密码"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">邀请码（选填）</label>
            <input className="form-input" placeholder="填写可获得额外奖励"
              value={form.referrerCode} onChange={e => setForm({ ...form, referrerCode: e.target.value })} />
          </div>

          <button className="btn-danger btn-block mt-16" onClick={submit} disabled={loading}>
            {loading ? '注册中...' : '立即注册'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', color: '#666', fontSize: 13 }}>
            已有账号？<Link to="/login" style={{ color: '#ee5a6f', fontWeight: 600 }}>立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
