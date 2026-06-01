import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { authAPI } from '../utils/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleLoginSuccess } = useAuth();
  const [step, setStep] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [currentCode, setCurrentCode] = useState('');

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    try {
      const res = await authAPI.sendCode(phone);
      setCurrentCode(res.data.code);
      setCountdown(60);
      setError('');
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setError('发送验证码失败');
    }
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      setError('请填写手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(phone, code);
      const result = response.data;
      if (result.success && !result.isNewUser) {
        handleLoginSuccess(result.token, result.user);
        navigate('/');
      } else if (result.isNewUser) {
        setTempPhone(phone);
        setStep('register');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!nickname) {
      setError('请填写昵称');
      return;
    }
    setLoading(true);
    try {
      await register({
        phone: tempPhone,
        nickname,
        inviteCode,
        realName,
        idCard
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🌍 网易星球</h1>
        <p>区块链价值共享平台</p>
      </div>
      <div className="card">
        {step === 'login' ? (
          <>
            <h2 style={{ marginBottom: 24, textAlign: 'center' }}>登录</h2>
            {error && <div className="warning">{error}</div>}
            <div style={{ marginBottom: 16 }}>
              <label className="label">手机号</label>
              <input
                type="tel"
                className="input"
                placeholder="请输入手机号"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">验证码</label>
              <div className="code-input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
                <button
                  className="btn btn-secondary code-btn"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : '获取'}
                </button>
              </div>
              {currentCode && (
                <p style={{ marginTop: 8, fontSize: 14, color: '#667eea', fontWeight: 'bold' }}>
                  📱 验证码：{currentCode}
                </p>
              )}
              <p style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                提示：验证码已显示在上方，请直接输入
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: 24, textAlign: 'center' }}>完善信息</h2>
            {error && <div className="warning">{error}</div>}
            <div style={{ marginBottom: 16 }}>
              <label className="label">昵称 *</label>
              <input
                type="text"
                className="input"
                placeholder="请输入昵称"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">邀请码（选填）</label>
              <input
                type="text"
                className="input"
                placeholder="请输入邀请码"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">真实姓名（选填）</label>
              <input
                type="text"
                className="input"
                placeholder="请输入真实姓名"
                value={realName}
                onChange={e => setRealName(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">身份证号（选填）</label>
              <input
                type="text"
                className="input"
                placeholder="请输入身份证号"
                value={idCard}
                onChange={e => setIdCard(e.target.value)}
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? '注册中...' : '完成注册'}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: 12 }}
              onClick={() => setStep('login')}
            >
              返回登录
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
