import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

function BindPhoneModal({ onClose, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { bindPhone } = useAuth();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号');
      return;
    }

    try {
      const response = await authApi.sendSmsCode(phone, 'bind');
      setCountdown(60);
      setError('');
      if (response.data?.mockCode) {
        setCode(response.data.mockCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || '发送验证码失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await bindPhone(phone, code);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || '绑定失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2 className="modal-title">绑定手机号</h2>
        <p className="modal-subtitle">为保障账号安全，请绑定手机号</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>手机号</label>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
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
            disabled={loading}
          >
            {loading ? '绑定中...' : '绑定手机号'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BindPhoneModal;
