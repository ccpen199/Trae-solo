import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const roleOptions = [
    { username: 'inventor', name: '个人发明人', desc: '专注于知识产权创造和保护' },
    { username: 'enterprise', name: '中小企业', desc: '企业知识产权全生命周期管理' },
    { username: 'lawfirm', name: '律所', desc: '专业知识产权法律服务' },
    { username: 'agency', name: '代理机构', desc: '一站式知识产权代理服务' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleUsername) => {
    setUsername(roleUsername);
    setPassword('123456');
    setError('');
    setLoading(true);
    try {
      await login(roleUsername, '123456');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || '身份选择登录失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>知识产权全生命周期平台</h1>
          <p style={styles.subtitle}>Intellectual Property Lifecycle Management</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div style={styles.formGroup}>
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

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>

          <div style={styles.quickLogin}>
            <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>快速登录（密码均为 123456）：</p>
            <div style={styles.roleGrid}>
              {roleOptions.map((role) => (
                <button
                  key={role.username}
                  type="button"
                  style={{
                    ...styles.roleButton,
                    ...(username === role.username ? styles.roleButtonActive : {})
                  }}
                  onClick={() => handleQuickLogin(role.username)}
                  disabled={loading}
                >
                  <div style={{ fontWeight: '600' }}>{role.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{role.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </form>
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
  loginBox: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  submitButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s'
  },
  quickLogin: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #eee'
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  roleButton: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#f8f9fa',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  roleButtonActive: {
    borderColor: '#667eea',
    background: '#eef2ff'
  }
};
