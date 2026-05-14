
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkPhone, sendCode, verifyCode, register, login } from '../api';

type Step = 'phone' | 'password-login' | 'code-login' | 'set-password';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [displayedCode, setDisplayedCode] = useState('');

  const handleCheckPhone = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setMessage('请输入正确的手机号');
      return;
    }
    const res = await checkPhone(phone);
    if (res.registered) {
      setStep('password-login');
    } else {
      setStep('code-login');
    }
  };

  const handleSendCode = async () => {
    const res = await sendCode(phone);
    if (res.success) {
      setDisplayedCode(res.verificationCode);
      setMessage(`验证码已发送: ${res.verificationCode}`);
    }
  };

  const handlePasswordLogin = async () => {
    const res = await login(phone, password);
    if (res.success) {
      authLogin({ userId: res.userId, phone: res.phone });
      navigate('/');
    } else {
      setMessage(res.message);
    }
  };

  const handleVerifyAndRegister = async () => {
    const verifyRes = await verifyCode(phone, code);
    if (!verifyRes.success) {
      setMessage(verifyRes.message);
      return;
    }
    setStep('set-password');
  };

  const handleSetPassword = async () => {
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSymbol = /[^\da-zA-Z]/.test(password);
    const typeCount = [hasNumber, hasLetter, hasSymbol].filter(Boolean).length;

    if (password.length < 6 || password.length > 16 || typeCount < 2) {
      setMessage('密码需6-16位，包含数字、字母、符号至少两种');
      return;
    }

    const res = await register(phone, password);
    authLogin({ userId: res.userId, phone });
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>滴滴出行</h1>

      {step === 'phone' && (
        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={11}
            type="tel"
          />
          <button style={styles.button} onClick={handleCheckPhone}>
            下一步
          </button>
        </div>
      )}

      {step === 'password-login' && (
        <div style={styles.form}>
          <p style={styles.phoneDisplay}>{phone}</p>
          <input
            style={styles.input}
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          <button style={styles.button} onClick={handlePasswordLogin}>
            登录
          </button>
          <button style={styles.linkButton} onClick={() => setStep('phone')}>
            更换手机号
          </button>
        </div>
      )}

      {step === 'code-login' && (
        <div style={styles.form}>
          <p style={styles.phoneDisplay}>{phone}</p>
          <div style={styles.codeRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <button style={styles.smallButton} onClick={handleSendCode}>
              获取验证码
            </button>
          </div>
          <button style={styles.button} onClick={handleVerifyAndRegister}>
            下一步
          </button>
          <button style={styles.linkButton} onClick={() => setStep('phone')}>
            更换手机号
          </button>
        </div>
      )}

      {step === 'set-password' && (
        <div style={styles.form}>
          <p style={styles.phoneDisplay}>设置密码</p>
          <input
            style={styles.input}
            placeholder="请设置密码 (6-16位)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          <button style={styles.button} onClick={handleSetPassword}>
            完成注册
          </button>
        </div>
      )}

      {message && (
        <div style={displayedCode ? styles.codeDisplay : styles.message}>
          {message}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    padding: '20px'
  },
  title: {
    fontSize: '32px',
    color: '#ff6600',
    marginBottom: '40px'
  },
  form: {
    width: '100%',
    maxWidth: '320px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  codeRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px'
  },
  smallButton: {
    padding: '14px 20px',
    background: '#ff6600',
    color: '#fff',
    borderRadius: '8px',
    whiteSpace: 'nowrap' as const
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#ff6600',
    color: '#fff',
    fontSize: '16px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  linkButton: {
    width: '100%',
    background: 'transparent',
    color: '#666',
    fontSize: '14px'
  },
  phoneDisplay: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center' as const
  },
  message: {
    marginTop: '20px',
    color: '#ff4444',
    fontSize: '14px'
  },
  codeDisplay: {
    marginTop: '20px',
    background: '#fff3e6',
    border: '2px dashed #ff6600',
    borderRadius: '8px',
    padding: '16px 24px',
    color: '#ff6600',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    letterSpacing: '2px'
  }
};
