import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ phone: '', email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
      </div>
      <h1 style={{ fontSize: '28px', marginBottom: '30px', color: '#333' }}>注册</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          placeholder="手机号"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', fontSize: '16px' }}
          required
        />
        <input
          type="email"
          placeholder="邮箱（可选）"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', fontSize: '16px' }}
        />
        <input
          type="text"
          placeholder="用户名（可选）"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', fontSize: '16px' }}
        />
        <input
          type="password"
          placeholder="密码"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          style={{ width: '100%', padding: '15px', marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', fontSize: '16px' }}
          required
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: '#ff6b35', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
