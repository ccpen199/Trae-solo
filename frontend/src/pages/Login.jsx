import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { authApi } from '../api';
import useStore from '../store';
import Loading from '../components/Loading';

const Login = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { setUser, setToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('phone');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');

  const handleThirdPartyLogin = async (type) => {
    setLoading(true);
    try {
      const names = { wechat: '微信用户', qq: 'QQ用户', weibo: '微博用户' };
      const response = await authApi.login({
        login_type: type,
        nickname: names[type] + Math.floor(Math.random() * 10000),
        openid: `${type}_${Date.now()}`
      });

      setToken(response.data.token);
      setUser(response.data.user);
      showSuccess('登录成功');
      setTimeout(() => navigate('/'), 300);
    } catch (error) {
      showError(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!nickname.trim()) {
      showError('请输入昵称');
      return;
    }

    if (loginType === 'phone' && !phone.trim()) {
      showError('请输入手机号');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({
        login_type: loginType,
        phone: loginType === 'phone' ? phone : undefined,
        nickname,
        openid: loginType !== 'phone' ? `${loginType}_${Date.now()}` : undefined
      });

      setToken(response.data.token);
      setUser(response.data.user);
      showSuccess('登录成功');
      setTimeout(() => navigate('/'), 300);
    } catch (error) {
      showError(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Loading text="登录中..." />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logo}>✨</div>
          <h1 style={styles.title}>微光</h1>
          <p style={styles.subtitle}>与兴趣相投的人一起看片</p>
        </div>

        <div style={styles.tabs}>
          {[
            { type: 'phone', label: '手机号', icon: '📱' },
            { type: 'wechat', label: '微信', icon: '💬' },
            { type: 'qq', label: 'QQ', icon: '🐧' },
            { type: 'weibo', label: '微博', icon: '📢' }
          ].map(item => (
            <button
              key={item.type}
              style={{ ...styles.tab, ...(loginType === item.type ? styles.tabActive : {}) }}
              onClick={() => {
                if (item.type === 'phone') {
                  setLoginType(item.type);
                } else {
                  handleThirdPartyLogin(item.type);
                }
              }}
            >
              <span>{item.icon}</span>
              <span style={styles.tabText}>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={styles.form}>
          {loginType === 'phone' && (
            <input
              style={styles.input}
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
          <input
            style={styles.input}
            type="text"
            placeholder="请输入昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>
            进入微光
          </button>
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
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    fontSize: '64px',
    marginBottom: '12px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#999',
    fontSize: '14px'
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '24px'
  },
  tab: {
    padding: '12px 8px',
    border: '2px solid #eee',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.3s ease'
  },
  tabActive: {
    borderColor: '#667eea',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)'
  },
  tabText: {
    fontSize: '12px',
    color: '#666'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    padding: '16px',
    border: '2px solid #eee',
    borderRadius: '12px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  button: {
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  }
};

export default Login;
