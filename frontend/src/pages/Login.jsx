import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api';
import { useStore } from '../store';
import { useToast } from '../App';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useStore();
  const { showToast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      showToast('请填写完整信息', 'error');
      return;
    }
    if (isRegister && !form.nickname) {
      showToast('请填写昵称', 'error');
      return;
    }

    setLoading(true);
    try {
      const api = isRegister ? authAPI.register : authAPI.login;
      const res = await api(form);
      
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        showToast(isRegister ? '注册成功' : '登录成功', 'success');
        const from = location.state?.from;
        setTimeout(() => {
          if (from && from !== '/login') {
            navigate(from, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 100);
      } else {
        showToast(res.data.message || '操作失败', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || '网络错误', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      padding: 20
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 40 }}>🦩</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>千鹤直播</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>高端人文社交直播平台</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              用户名
            </label>
            <input
              type="text"
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名"
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                昵称
              </label>
              <input
                type="text"
                className="input"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="请输入昵称"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8, padding: 14 }}
          >
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{
            width: '100%',
            marginTop: 16,
            background: 'none',
            color: 'var(--primary)',
            fontSize: 14
          }}
        >
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </button>

        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'var(--gray-50)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--gray-500)'
        }}>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>演示账号：</p>
          <p>用户名: demo1 / 密码: 123456</p>
        </div>
      </div>
    </div>
  );
}
