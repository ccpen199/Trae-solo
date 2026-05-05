import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { authAPI } from '../utils/api';

const styles = {
  container: {
    maxWidth: '400px',
    margin: '60px auto',
    padding: '40px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  error: {
    background: '#fff0f0',
    color: '#d93025',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  success: {
    background: '#f0fff4',
    color: '#38a169',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
    fontSize: '14px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        nickname: form.nickname || undefined
      });
      const { data } = response.data;
      setUser(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>注册</h2>
      
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>用户名 *</label>
          <input
            type="text"
            style={styles.input}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="3-20个字符"
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>昵称</label>
          <input
            type="text"
            style={styles.input}
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="留空则使用用户名"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>邮箱</label>
          <input
            type="email"
            style={styles.input}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="可选"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>密码 *</label>
          <input
            type="password"
            style={styles.input}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="至少6个字符"
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>确认密码 *</label>
          <input
            type="password"
            style={styles.input}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="再次输入密码"
            required
          />
        </div>

        <button
          type="submit"
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <div style={styles.footer}>
        已有账户？
        <Link to="/login" style={styles.link}>立即登录</Link>
      </div>
    </div>
  );
}

export default Register;
