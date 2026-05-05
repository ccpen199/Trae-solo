import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useModalStore } from '@/store';
import { authApi } from '@/api';

const LoginModal: React.FC = () => {
  const { showLoginModal, redirectAfterLogin, setShowLoginModal } = useModalStore();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showLoginModal) return null;

  const handleClose = () => {
    setShowLoginModal(false);
    setError('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('请输入手机号和密码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.login(phone, password);
      setUser(result.data.user, result.data.token);
      handleClose();
      
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin);
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phone || !password || !confirmPassword) {
      setError('请填写完整信息');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.register(phone, password, nickname || undefined);
      setUser(result.data.user, result.data.token);
      handleClose();
      
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin);
      }
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    width: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    position: 'relative',
  };

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 24,
    cursor: 'pointer',
    color: '#999',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    textAlign: 'center',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    marginBottom: 24,
    borderBottom: '1px solid #f0f0f0',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 0',
    textAlign: 'center',
    cursor: 'pointer',
    color: active ? '#ff385c' : '#999',
    borderBottom: active ? '2px solid #ff385c' : '2px solid transparent',
    marginBottom: -1,
  });

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const errorStyle: React.CSSProperties = {
    color: '#ff4d4f',
    fontSize: 14,
    marginBottom: 16,
  };

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ff385c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  const switchTextStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  };

  const linkStyle: React.CSSProperties = {
    color: '#ff385c',
    cursor: 'pointer',
    marginLeft: 4,
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <span style={closeBtnStyle} onClick={handleClose}>
          ✕
        </span>

        <h2 style={titleStyle}>{mode === 'login' ? '欢迎回来' : '注册账号'}</h2>

        <div style={tabsStyle}>
          <div style={tabStyle(mode === 'login')} onClick={() => setMode('login')}>
            登录
          </div>
          <div style={tabStyle(mode === 'register')} onClick={() => setMode('register')}>
            注册
          </div>
        </div>

        <div style={inputGroupStyle}>
          <input
            type="tel"
            placeholder="请输入手机号"
            style={inputStyle}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={11}
          />
        </div>

        {mode === 'register' && (
          <div style={inputGroupStyle}>
            <input
              type="text"
              placeholder="昵称（选填）"
              style={inputStyle}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        )}

        <div style={inputGroupStyle}>
          <input
            type="password"
            placeholder="请输入密码"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === 'register' && (
          <div style={inputGroupStyle}>
            <input
              type="password"
              placeholder="请再次输入密码"
              style={inputStyle}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <button
          style={btnStyle}
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </button>

        <div style={switchTextStyle}>
          {mode === 'login' ? (
            <>
              还没有账号？
              <span style={linkStyle} onClick={() => setMode('register')}>
                立即注册
              </span>
            </>
          ) : (
            <>
              已有账号？
              <span style={linkStyle} onClick={() => setMode('login')}>
                立即登录
              </span>
            </>
          )}
        </div>

        <div style={{ ...switchTextStyle, marginTop: 12, color: '#999' }}>
          测试账号：13800138000 / 123456
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
