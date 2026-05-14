import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  
  const [loginType, setLoginType] = useState('code');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const validatePhone = (phone) => {
    return /^\d{11}$/.test(phone);
  };

  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入正确的11位手机号');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.sendCode(phone);
      if (res.data.success) {
        setError('');
        if (res.data.data?.debug) {
          alert(`验证码已发送: ${res.data.data.debug.code}（5分钟内有效）`);
        } else {
          alert('验证码已发送到您的手机');
        }
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      setError('请输入正确的11位手机号');
      return;
    }

    try {
      setLoading(true);
      let res;
      
      if (loginType === 'code') {
        if (!code) {
          setError('请输入验证码');
          return;
        }
        res = await authApi.loginByCode(phone, code);
      } else {
        if (!password) {
          setError('请输入密码');
          return;
        }
        res = await authApi.loginByPassword(phone, password);
      }

      if (res.data.success) {
        const { token, user } = res.data.data;
        setAuth(token, user);
        localStorage.setItem('token', token);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = async (type) => {
    try {
      setLoading(true);
      const res = await authApi.thirdPartyLogin({
        thirdType: type,
        thirdId: `${type}_${Date.now()}`,
        nickname: type === 'wechat' ? '微信用户' : type === 'qq' ? 'QQ用户' : '微博用户',
        avatar: ''
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        setAuth(token, user);
        localStorage.setItem('token', token);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || '第三方登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ff6a00 0%, #ff8a33 100%)', padding: '20px' }}>
      <div style={{ textAlign: 'center', paddingTop: '80px', marginBottom: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🚗</div>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '600' }}>滴滴快车</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px' }}>美好出行，从这里开始</p>
      </div>

      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #e5e5e5' }}>
          <div 
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              paddingBottom: '12px',
              color: loginType === 'code' ? '#ff6a00' : '#999',
              fontWeight: loginType === 'code' ? '600' : '400',
              borderBottom: loginType === 'code' ? '2px solid #ff6a00' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => { setLoginType('code'); setError(''); }}
          >
            验证码登录
          </div>
          <div 
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              paddingBottom: '12px',
              color: loginType === 'password' ? '#ff6a00' : '#999',
              fontWeight: loginType === 'password' ? '600' : '400',
              borderBottom: loginType === 'password' ? '2px solid #ff6a00' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => { setLoginType('password'); setError(''); }}
          >
            密码登录
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '0 12px' }}>
              <span style={{ color: '#999', marginRight: '8px' }}>🇨🇳 +86</span>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                style={{ 
                  flex: 1, 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '16px', 
                  padding: '14px 0' 
                }}
              />
            </div>
          </div>

          {loginType === 'code' ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '0 12px' }}>
                  <input
                    type="text"
                    placeholder="请输入验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ 
                      width: '100%', 
                      border: 'none', 
                      outline: 'none', 
                      fontSize: '16px', 
                      padding: '14px 0' 
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || loading}
                  style={{ 
                    padding: '0 16px', 
                    borderRadius: '8px', 
                    border: '1px solid #ff6a00',
                    background: countdown > 0 ? '#f5f5f5' : 'white',
                    color: countdown > 0 ? '#999' : '#ff6a00',
                    fontWeight: '500',
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    minWidth: '100px'
                  }}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '0 12px' }}>
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    outline: 'none', 
                    fontSize: '16px', 
                    padding: '14px 0' 
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: '#f5222d', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#ff6a00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '24px', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <span className="loading" style={{ marginRight: '8px' }}></span> : null}
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }}></div>
            <span style={{ color: '#999', fontSize: '12px' }}>其他方式登录</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div 
              onClick={() => handleThirdPartyLogin('wechat')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '4px' }}>💚</div>
              <span style={{ fontSize: '12px', color: '#666' }}>微信</span>
            </div>
            <div 
              onClick={() => handleThirdPartyLogin('qq')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '4px' }}>💙</div>
              <span style={{ fontSize: '12px', color: '#666' }}>QQ</span>
            </div>
            <div 
              onClick={() => handleThirdPartyLogin('weibo')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '4px' }}>❤️</div>
              <span style={{ fontSize: '12px', color: '#666' }}>微博</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
          登录即表示同意《用户协议》和《隐私政策》
        </div>
      </div>
    </div>
  );
};

export default LoginPage;