import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <span style={styles.logoIcon}>🤖</span>
          <h1 style={styles.title}>AI 会议行动项跟踪</h1>
          <p style={styles.subtitle}>智能追踪会议决议，确保每项行动落地</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="请输入密码"
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={styles.tips}>
          <p style={styles.tipTitle}>测试账号：</p>
          <div style={styles.tipItem}>管理员: admin / admin123</div>
          <div style={styles.tipItem}>普通用户: user1 / user123</div>
          <div style={styles.tipItem}>审核员: auditor / audit123</div>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  logoSection: { textAlign: 'center', marginBottom: 30 },
  logoIcon: { fontSize: 48 },
  title: { fontSize: 24, margin: '10px 0', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  error: {
    padding: 12,
    backgroundColor: '#fff1f0',
    color: '#f5222d',
    borderRadius: 6,
    fontSize: 14
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 14, color: '#333', fontWeight: 500 },
  input: {
    padding: '12px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    fontSize: 14,
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '14px',
    backgroundColor: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  tips: { marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' },
  tipTitle: { fontSize: 13, color: '#666', marginBottom: 8 },
  tipItem: { fontSize: 12, color: '#999', lineHeight: 1.8 }
};
