import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store';
import { useToast } from '../components/Toast';

const Login = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationRequested, setNotificationRequested] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const login = useStore(state => state.login);
  const token = useStore(state => state.token);
  const fetchUserProfile = useStore(state => state.fetchUserProfile);
  const updateNotificationPermission = useStore(state => state.updateNotificationPermission);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!account.trim()) {
      showToast('请输入淘宝账号', 'error');
      return;
    }
    if (!password.trim()) {
      showToast('请输入密码', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await login(account, password);
      if (result.success) {
        showToast('登录成功', 'success');
        
        if (!notificationRequested && 'Notification' in window) {
          const permission = Notification.permission;
          if (permission === 'default') {
            try {
              const newPermission = await Notification.requestPermission();
              if (newPermission === 'granted') {
                await updateNotificationPermission(true);
              }
            } catch (err) {
              console.log('通知权限请求被拒绝或失败');
            }
          } else if (permission === 'granted') {
            await updateNotificationPermission(true);
          }
          setNotificationRequested(true);
        }

        await fetchUserProfile();
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(err.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    navigate('/', { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🛒</span>
        </div>
        <h1 style={styles.title}>ME 淘</h1>
        <p style={styles.subtitle}>登录后享受完整功能</p>
      </div>

      <form style={styles.form} onSubmit={handleLogin}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>淘宝账号</label>
          <input
            style={styles.input}
            type="text"
            placeholder="请输入淘宝账号"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>或</span>
          <span style={styles.dividerLine}></span>
        </div>

        <button
          type="button"
          style={styles.guestButton}
          onClick={handleGuest}
          disabled={loading}
        >
          先逛逛看
        </button>
      </form>

      <div style={styles.tip}>
        <p>测试账号：test@taobao</p>
        <p>密码：123456</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    padding: '40px 24px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px'
  },
  logo: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  logoIcon: {
    fontSize: '40px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#999'
  },
  form: {
    maxWidth: '400px',
    margin: '0 auto'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#ff4757',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '8px'
  },
  buttonDisabled: {
    backgroundColor: '#ff9ba2',
    cursor: 'not-allowed'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#eee'
  },
  dividerText: {
    padding: '0 16px',
    color: '#999',
    fontSize: '12px'
  },
  guestButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  tip: {
    marginTop: '40px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#bbb'
  }
};

export default Login;
