import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const Login = () => {
  const [loginMode, setLoginMode] = useState('code');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validatePhone = () => {
    if (!phone) {
      setError('请输入手机号');
      return false;
    }
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号');
      return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    if (!validatePhone()) return;
    setError('');
    try {
      await axios.post('/api/auth/send-code', { phone });
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      alert('验证码已发送（测试用 123456）');
    } catch (e) {
      setError('发送失败，请重试');
    }
  };

  const handleWechatLogin = async () => {
    try {
      await login(`WX${Date.now().toString().slice(-10)}`, '123456');
      navigate('/');
      alert('微信登录成功！');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validatePhone()) return;
    
    if (loginMode === 'code' && !code) {
      setError('请输入验证码');
      return;
    }
    
    setError('');
    try {
      await login(phone, loginMode === 'code' ? (code || '123456') : null);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  const styles = {
    container: {
      padding: '30px 20px',
      background: '#fff',
      minHeight: '100vh'
    },
    logo: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    logoIcon: {
      fontSize: '60px',
      marginBottom: '10px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '30px',
      textAlign: 'center'
    },
    tabs: {
      display: 'flex',
      marginBottom: '20px',
      borderBottom: '2px solid #f0f0f0'
    },
    tab: {
      flex: 1,
      padding: '15px',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '16px'
    },
    tabActive: {
      color: '#ff4d4f',
      borderBottom: '2px solid #ff4d4f',
      marginBottom: '-2px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    input: {
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px'
    },
    inputError: {
      borderColor: '#ff4d4f'
    },
    codeRow: {
      display: 'flex',
      gap: '10px'
    },
    codeInput: {
      flex: 1
    },
    sendBtn: {
      padding: '15px 20px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    },
    sendBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    loginBtn: {
      padding: '15px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      marginTop: '20px',
      cursor: 'pointer'
    },
    error: {
      color: '#ff4d4f',
      fontSize: '14px',
      textAlign: 'center',
      marginTop: '10px'
    },
    hint: {
      textAlign: 'center',
      color: '#999',
      fontSize: '12px',
      marginTop: '10px'
    },
    otherLogin: {
      marginTop: '40px',
      textAlign: 'center'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      color: '#999',
      marginBottom: '20px'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#ddd'
    },
    dividerText: {
      padding: '0 15px'
    },
    socialBtns: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px'
    },
    socialBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    socialIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    },
    wechatBg: {
      background: '#07c160'
    },
    socialText: {
      fontSize: '12px',
      color: '#666'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>🐔</div>
        <h1 style={styles.title}>云集会员电商</h1>
      </div>
      
      <div style={styles.tabs}>
        <div 
          style={{ ...styles.tab, ...(loginMode === 'code' ? styles.tabActive : {}) }}
          onClick={() => { setLoginMode('code'); setError(''); }}
        >
          验证码登录
        </div>
        <div 
          style={{ ...styles.tab, ...(loginMode === 'password' ? styles.tabActive : {}) }}
          onClick={() => { setLoginMode('password'); setError(''); }}
        >
          密码登录
        </div>
      </div>

      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          maxLength={11}
          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
          style={{ ...styles.input, ...(error && !phone ? styles.inputError : {}) }}
        />
        
        {loginMode === 'code' ? (
          <div style={styles.codeRow}>
            <input
              type="text"
              placeholder="请输入验证码"
              value={code}
              maxLength={6}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...styles.input, ...styles.codeInput }}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0}
              style={{ ...styles.sendBtn, ...(countdown > 0 ? styles.sendBtnDisabled : {}) }}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
        ) : (
          <input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
          />
        )}
        
        <button type="submit" style={styles.loginBtn}>
          {loginMode === 'code' ? '登录' : '密码登录'}
        </button>
        
        {error && <div style={styles.error}>{error}</div>}
        <p style={styles.hint}>💡 测试提示：输入任意11位手机号，验证码直接用 123456</p>
      </form>

      <div style={styles.otherLogin}>
        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>第三方登录</span>
          <div style={styles.dividerLine}></div>
        </div>
        <div style={styles.socialBtns}>
          <button type="button" onClick={handleWechatLogin} style={styles.socialBtn}>
            <div style={{ ...styles.socialIcon, ...styles.wechatBg }}>💬</div>
            <span style={styles.socialText}>微信登录</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
