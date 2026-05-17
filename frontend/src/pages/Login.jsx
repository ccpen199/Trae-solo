import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import useStore from '../store';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isLogin 
        ? await authAPI.login(phone, password)
        : await authAPI.register(phone, password, nickname);
      
      if (res.success) {
        login(res.data.user, res.data.token);
        navigate('/');
      } else {
        setError(res.message || '操作失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>🎧 ASMR-ers</h1>
        <p style={styles.subtitle}>沉浸式音视频平台</p>
        
        <h2 style={styles.formTitle}>{isLogin ? '登录' : '注册'}</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>手机号</label>
            <input
              type="tel"
              inputMode="numeric"
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="请输入手机号"
              required
            />
          </div>
          
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>昵称</label>
              <input
                type="text"
                inputMode="text"
                style={styles.input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                required
              />
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '加载中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>
        
        <p style={styles.toggle}>
          {isLogin ? '还没有账号？' : '已有账号？'}
          <span 
            style={styles.toggleLink} 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? '立即注册' : '去登录'}
          </span>
        </p>
        
        <p style={styles.tip}>测试账号：13800138001，密码：123456</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
    padding: 20,
  },
  box: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: 24,
    padding: 48,
    width: '100%',
    maxWidth: 420,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
    background: 'linear-gradient(135deg, #8b5cf6 0%, #f472b6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    textAlign: 'center',
    color: '#9ca3af',
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 24,
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#d1d5db',
  },
  input: {
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    border: 'none',
    borderRadius: 12,
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  toggle: {
    textAlign: 'center',
    marginTop: 24,
    color: '#9ca3af',
    fontSize: 14,
  },
  toggleLink: {
    color: '#8b5cf6',
    marginLeft: 4,
    cursor: 'pointer',
  },
  tip: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6b7280',
    fontSize: 12,
  },
};

export default Login;
