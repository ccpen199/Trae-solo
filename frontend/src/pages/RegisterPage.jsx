import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const [form, setForm] = useState({
    nickname: '',
    phone: '',
    password: '',
    code: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validate = () => {
    const newErrors = {};
    if (form.nickname.length < 2 || form.nickname.length > 20) {
      newErrors.nickname = '昵称长度需在2-20个字符之间';
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }
    if (form.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    if (form.code.length !== 6) {
      newErrors.code = '请输入6位验证码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    const phoneError = {};
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      phoneError.phone = '请输入正确的手机号';
      setErrors({ ...errors, ...phoneError });
      return;
    }

    setErrors({});
    setSendingCode(true);
    try {
      const res = await api.post('/auth/send-code', { phone: form.phone });
      if (res.data.success) {
        const realCode = res.data.data.code;
        showToast(`验证码: ${realCode}（已自动填充）`, 'success', 6000);
        setCountdown(60);
        setForm({ ...form, code: realCode });
        console.log('📱 =====================================');
        console.log('📱 手机号:', form.phone);
        console.log('📱 验证码:', realCode);
        console.log('📱 =====================================');
      }
    } catch (error) {
      console.error('Send code error:', error);
      showToast(error.response?.data?.message || '发送失败，请重试', 'error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        showToast('注册成功', 'success');
        navigate('/home');
      }
    } catch (error) {
      console.error('Register error:', error);
      showToast(error.response?.data?.message || '注册失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logo}>🧘</div>
        <h1 style={styles.title}>创建账户</h1>
        <p style={styles.subtitle}>开启您的冥想之旅</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              className={`input ${errors.nickname ? 'error' : ''}`}
              placeholder="请输入昵称"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
            {errors.nickname && <div className="error-text">{errors.nickname}</div>}
          </div>
          
          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              className={`input ${errors.phone ? 'error' : ''}`}
              placeholder="请输入手机号"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {errors.phone && <div className="error-text">{errors.phone}</div>}
          </div>
          
          <div className="form-group">
            <label>验证码</label>
            <div style={styles.codeInput}>
              <input
                type="text"
                className={`input ${errors.code ? 'error' : ''}`}
                placeholder="请输入验证码"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                style={{ flex: 1, marginRight: '12px' }}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                style={styles.codeButton}
              >
                {countdown > 0 ? `${countdown}s` : (sendingCode ? '发送中' : '获取验证码')}
              </button>
            </div>
            {errors.code && <div className="error-text">{errors.code}</div>}
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              className={`input ${errors.password ? 'error' : ''}`}
              placeholder="请设置密码（至少6位）"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <div className="error-text">{errors.password}</div>}
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <span>已有账户？</span>
          <Link to="/login" style={styles.link}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  content: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
  },
  logo: {
    fontSize: '60px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    textAlign: 'center',
    color: '#333',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    textAlign: 'center',
    color: '#999',
    marginBottom: '30px'
  },
  form: {
    marginBottom: '24px'
  },
  codeInput: {
    display: 'flex',
    alignItems: 'center'
  },
  codeButton: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  footer: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 600,
    marginLeft: '4px'
  }
};

export default RegisterPage;
