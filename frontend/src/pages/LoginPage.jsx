import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import BindPhoneModal from '../components/BindPhoneModal';

function LoginPage() {
  const [loginType, setLoginType] = useState('sms');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBindModal, setShowBindModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
      const response = await authApi.sendSms(phone);
      setCountdown(60);
      setError('');
      if (response.data?.mockCode) {
        setCode(response.data.mockCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || '发送验证码失败');
    }
  };

  const handleSmsLogin = async (e) => {
    e.preventDefault();
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login('sms', { phone, code });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login('password', { account, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = async (type) => {
    setLoading(true);
    setError('');

    try {
      const result = await login('thirdParty', {
        third_party_id: `${type}_${Date.now()}`,
        third_party_type: type,
        nickname: `${type}用户${Math.floor(Math.random() * 1000)}`
      });

      if (result.user && !result.user.is_phone_bound) {
        setPendingUser(result.user);
        setShowBindModal(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBindSuccess = () => {
    setShowBindModal(false);
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">欢迎登录</h1>
        <p className="login-subtitle">新商业资讯平台</p>

        <div className="login-tabs">
          <div
            className={`login-tab ${loginType === 'sms' ? 'active' : ''}`}
            onClick={() => setLoginType('sms')}
          >
            验证码登录
          </div>
          <div
            className={`login-tab ${loginType === 'password' ? 'active' : ''}`}
            onClick={() => setLoginType('password')}
          >
            密码登录
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loginType === 'sms' ? (
          <form onSubmit={handleSmsLogin}>
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
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <div className="input-group">
              <label>手机号/邮箱</label>
              <input
                type="text"
                placeholder="请输入手机号或邮箱"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>密码</label>
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="forgot-password">
              <Link to="/reset-password">忘记密码？</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        <div className="divider">
          <span>其他登录方式</span>
        </div>

        <div className="third-party-login">
          <button
            type="button"
            className="third-party-btn wechat"
            onClick={() => handleThirdPartyLogin('wechat')}
            disabled={loading}
            title="微信登录"
          >
            微
          </button>
          <button
            type="button"
            className="third-party-btn weibo"
            onClick={() => handleThirdPartyLogin('weibo')}
            disabled={loading}
            title="微博登录"
          >
            微
          </button>
          <button
            type="button"
            className="third-party-btn qq"
            onClick={() => handleThirdPartyLogin('qq')}
            disabled={loading}
            title="QQ登录"
          >
            Q
          </button>
        </div>

        <div className="switch-login">
          <Link to="/">返回首页</Link>
        </div>
      </div>

      {showBindModal && (
        <BindPhoneModal
          onClose={() => setShowBindModal(false)}
          onSuccess={handleBindSuccess}
        />
      )}
    </div>
  );
}

export default LoginPage;
