import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { showToast } from '../utils/request';
import useAuthStore from '../store/authStore';

function Login() {
  const navigate = useNavigate();
  const { login, token } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState('');

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入有效的手机号');
      return;
    }

    try {
      const res = await request.post('/auth/send-code', { phone });
      if (res?.success) {
        setCountdown(60);
        setDemoCode(res?.data?.code);
        showToast('验证码已发送');
      }
    } catch (e) {
      showToast('发送失败，请重试');
    }
  };

  const handleDouyinLogin = async () => {
    setLoading(true);
    try {
      const res = await request.post('/auth/login', { douyinToken: 'demo' });
      if (res?.success) {
        login(res.data.token, res.data.user);
        showToast('登录成功');
        navigate('/');
      } else {
        showToast(res?.message || '登录失败');
      }
    } catch (e) {
      showToast('登录失败，请使用手机号登录');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      showToast('请输入手机号和验证码');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post('/auth/login', { phone, code });
      if (res?.success) {
        login(res.data.token, res.data.user);
        showToast('登录成功');
        navigate('/');
      } else {
        showToast(res?.message || '登录失败');
      }
    } catch (e) {
      showToast('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>多闪</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>短视频社交平台</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          className="btn btn-block"
          style={{ 
            background: '#000', 
            color: '#fff',
            padding: '14px 24px',
            fontSize: 16
          }}
          onClick={handleDouyinLogin}
          disabled={loading}
        >
          🔵 抖音授权登录
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24, color: 'var(--text-secondary)' }}>
        ———— 或使用手机号登录 ————
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="tel"
          className="input"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          maxLength={11}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          className="input"
          placeholder="请输入验证码"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-outline"
          onClick={handleSendCode}
          disabled={countdown > 0 || loading}
          style={{ minWidth: 120, whiteSpace: 'nowrap' }}
        >
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </button>
      </div>

      {demoCode && (
        <div style={{ 
          background: '#fff3cd', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 24,
          fontSize: 13,
          textAlign: 'center'
        }}>
          演示验证码: <strong>{demoCode}</strong>
        </div>
      )}

      <button
        className="btn btn-primary btn-block"
        onClick={handleLogin}
        disabled={loading}
        style={{ padding: '14px 24px', fontSize: 16 }}
      >
        {loading ? <span className="spinner" style={{ width: 18, height: 18, marginRight: 8 }} /> : null}
        登录
      </button>

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-secondary)' }}>
        登录即表示同意《用户协议》和《隐私政策》
      </div>
    </div>
  );
}

export default Login;
