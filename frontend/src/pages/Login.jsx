import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login, register, socialLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login({
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          password: formData.password
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || '操作失败，请重试');
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      await socialLogin({
        provider,
        providerId: `${provider}_${Date.now()}`,
        username: `${provider}用户`
      });
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✓</span>
          <h1 style={styles.title}>滴答清单</h1>
          <p style={styles.subtitle}>高效管理你的每一项任务</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          {isRegister && (
            <input
              type="text"
              placeholder="用户名"
              style={styles.input}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          )}
          
          <input
            type="email"
            placeholder="邮箱地址"
            style={styles.input}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          
          {isRegister && (
            <input
              type="tel"
              placeholder="手机号码（可选）"
              style={styles.input}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          )}
          
          <input
            type="password"
            placeholder="密码"
            style={styles.input}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          
          <button type="submit" style={styles.submitBtn}>
            {isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div style={styles.divider}>
          <span>或使用以下方式登录</span>
        </div>

        <div style={styles.socialBtns}>
          <button 
            style={{ ...styles.socialBtn, background: '#07c160', color: 'white' }}
            onClick={() => handleSocialLogin('wechat')}
          >
            微信登录
          </button>
          <button 
            style={{ ...styles.socialBtn, background: '#12b7f5', color: 'white' }}
            onClick={() => handleSocialLogin('qq')}
          >
            QQ登录
          </button>
          <button 
            style={{ ...styles.socialBtn, background: '#000', color: 'white' }}
            onClick={() => handleSocialLogin('apple')}
          >
            Apple登录
          </button>
        </div>

        <p style={styles.toggle}>
          {isRegister ? '已有账号？' : '还没有账号？'}
          <button 
            style={styles.toggleBtn}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? '立即登录' : '立即注册'}
          </button>
        </p>
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
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  logo: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logoIcon: {
    fontSize: '48px',
    color: '#dd4b39'
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    marginTop: '8px',
    color: '#333'
  },
  subtitle: {
    color: '#666',
    marginTop: '4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    padding: '14px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  error: {
    background: '#fee',
    color: '#c53727',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #dd4b39 0%, #c53727 100%)',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px'
  },
  divider: {
    textAlign: 'center',
    margin: '24px 0',
    color: '#999',
    fontSize: '14px',
    position: 'relative'
  },
  socialBtns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  socialBtn: {
    padding: '12px 8px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  toggle: {
    textAlign: 'center',
    marginTop: '24px',
    color: '#666',
    fontSize: '14px'
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#dd4b39',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 500,
    marginLeft: '4px'
  }
};
