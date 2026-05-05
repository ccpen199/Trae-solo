import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { accountAPI } from '../api';

const ResetPasswordPage = () => {
  const [resetType, setResetType] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const data = { newPassword };
      
      if (resetType === 'email') {
        if (!email) {
          setError('请输入邮箱');
          setLoading(false);
          return;
        }
        data.email = email;
      } else {
        if (!phone) {
          setError('请输入手机号');
          setLoading(false);
          return;
        }
        data.phone = phone;
      }

      await accountAPI.resetPassword(data);
      
      setSuccess('密码重置成功！即将跳转到登录页');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || '重置密码失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>重置密码</h1>
          <p style={styles.subtitle}>通过邮箱或手机号找回您的密码</p>
        </div>

        <div style={styles.typeSelector}>
          <button
            style={{ ...styles.typeBtn, ...(resetType === 'email' ? styles.typeBtnActive : {}) }}
            onClick={() => setResetType('email')}
          >
            邮箱找回
          </button>
          <button
            style={{ ...styles.typeBtn, ...(resetType === 'phone' ? styles.typeBtnActive : {}) }}
            onClick={() => setResetType('phone')}
          >
            手机找回
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {resetType === 'email' ? (
            <div style={styles.inputGroup}>
              <label style={styles.label}>注册邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入注册时使用的邮箱"
                style={styles.input}
              />
            </div>
          ) : (
            <div style={styles.inputGroup}>
              <label style={styles.label}>注册手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入注册时使用的手机号"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码 (至少6位)"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? '重置中...' : '重置密码'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/login" style={styles.link}>返回登录</Link>
        </div>
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
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: 0
  },
  typeSelector: {
    display: 'flex',
    marginBottom: '24px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#f5f5f5'
  },
  typeBtn: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.2s'
  },
  typeBtnActive: {
    background: '#667eea',
    color: 'white'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '14px 16px',
    border: '2px solid #eee',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  success: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  links: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '24px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px'
  }
};

export default ResetPasswordPage;
