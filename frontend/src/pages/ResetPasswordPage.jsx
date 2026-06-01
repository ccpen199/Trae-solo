import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

function ResetPasswordPage() {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!account || !/^1[3-9]\d{9}$/.test(account)) {
      setError('请输入有效的手机号');
      return;
    }

    try {
      const response = await authApi.sendSmsCode(account, 'reset');
      setCountdown(60);
      setError('');
      if (response.data?.mockCode) {
        setCode(response.data.mockCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || '发送验证码失败');
    }
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!account) {
      setError('请输入手机号');
      return;
    }
    setStep(2);
    setError('');
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    if (!code) {
      setError('请输入验证码');
      return;
    }
    setStep(3);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('请输入密码');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword(account, code, newPassword);
      setSuccess('密码重置成功！');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || '重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">忘记密码</h1>
        <p className="login-subtitle">重置您的账号密码</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="input-group">
              <label>手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                maxLength={11}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
            >
              下一步
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div className="input-group">
              <label>手机号</label>
              <input
                type="tel"
                value={account}
                disabled
                style={{ background: '#f5f5f5' }}
              />
            </div>

            <div className="input-group">
              <label>验证码</label>
              <div className="code-input-wrapper">
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  type="button"
                  className="code-btn"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s后重新获取` : '获取验证码'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
            >
              下一步
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>新密码</label>
              <input
                type="password"
                placeholder="请输入新密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>确认密码</label>
              <input
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>
        )}

        <div className="switch-login">
          <Link to="/login">返回登录</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
