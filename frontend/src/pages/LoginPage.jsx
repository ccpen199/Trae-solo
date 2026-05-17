import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }
    if (form.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        showToast('登录成功', 'success');
        navigate('/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.response?.data?.message || '登录失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logo}>🧘</div>
        <h1 style={styles.title}>欢迎回来</h1>
        <p style={styles.subtitle}>登录您的 NowHere 账户</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
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
            <label>密码</label>
            <input
              type="password"
              className={`input ${errors.password ? 'error' : ''}`}
              placeholder="请输入密码"
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
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <span>还没有账户？</span>
          <Link to="/register" style={styles.link}>立即注册</Link>
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

export default LoginPage;
