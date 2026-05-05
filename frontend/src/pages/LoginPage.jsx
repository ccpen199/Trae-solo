import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [loginType, setLoginType] = useState('cid');
  const [cid, setCid] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData = { password };
      
      if (loginType === 'cid') {
        if (!cid) {
          setError('请输入CID账号');
          setLoading(false);
          return;
        }
        loginData.cid = cid;
      } else if (loginType === 'email') {
        if (!email) {
          setError('请输入邮箱');
          setLoading(false);
          return;
        }
        loginData.email = email;
      } else {
        if (!phone) {
          setError('请输入手机号');
          setLoading(false);
          return;
        }
        loginData.phone = phone;
      }

      await login(loginData);
      navigate('/contacts');
    } catch (err) {
      setError(err.message || '登录失败，请检查账号和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Weaver</h1>
          <p style={styles.subtitle}>熟人视频通讯</p>
        </div>

        <div style={styles.typeSelector}>
          <button
            style={{ ...styles.typeBtn, ...(loginType === 'cid' ? styles.typeBtnActive : {}) }}
            onClick={() => setLoginType('cid')}
          >
            CID登录
          </button>
          <button
            style={{ ...styles.typeBtn, ...(loginType === 'email' ? styles.typeBtnActive : {}) }}
            onClick={() => setLoginType('email')}
          >
            邮箱登录
          </button>
          <button
            style={{ ...styles.typeBtn, ...(loginType === 'phone' ? styles.typeBtnActive : {}) }}
            onClick={() => setLoginType('phone')}
          >
            手机登录
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {loginType === 'cid' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>CID账号</label>
              <input
                type="text"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="请输入CID账号 (如: W1234567890)"
                style={styles.input}
              />
            </div>
          )}

          {loginType === 'email' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                style={styles.input}
              />
            </div>
          )}

          {loginType === 'phone' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/register" style={styles.link}>注册账号</Link>
          <Link to="/reset-password" style={styles.link}>忘记密码</Link>
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
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
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
    justifyContent: 'space-between',
    marginTop: '24px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px'
  }
};

export default LoginPage;
