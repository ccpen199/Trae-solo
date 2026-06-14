import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validatePhone = (value) => {
    if (!value) {
      setPhoneError('请输入手机号');
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      setPhoneError('请输入正确的11位手机号');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('请输入密码');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('密码长度不能少于6位');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const phoneValid = validatePhone(phone);
    const passwordValid = validatePassword(password);
    
    if (!phoneValid || !passwordValid) {
      return;
    }

    setLoading(true);
    try {
      const result = await login(phone, password);
      const role = result.user?.role || 'user';
      if (role === 'agent') {
        navigate('/admin');
      } else if (role === 'provider') {
        navigate('/dashboard/provider');
      } else {
        navigate('/dashboard/user');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error;
      console.log('登录错误:', errMsg);
      if (errMsg?.includes('未注册') || errMsg?.includes('不存在')) {
        setError('该手机号未注册，请先注册');
      } else if (errMsg?.includes('密码') || errMsg?.includes('错误')) {
        setError('密码错误，请重新输入');
      } else if (errMsg?.includes('格式') || errMsg?.includes('required')) {
        setError('请输入正确的手机号格式');
      } else {
        setError(errMsg || '登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="card">
          <h2 className="card-title">欢迎登录</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            登录后可发布信息、发起交易、享受更多服务
          </p>
          
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>手机号码 <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) validatePhone(e.target.value);
                }}
                onBlur={() => validatePhone(phone)}
                placeholder="请输入11位手机号码"
                maxLength={11}
                style={{ borderColor: phoneError ? '#e74c3c' : '' }}
              />
              {phoneError && (
                <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', margin: 0 }}>
                  {phoneError}
                </p>
              )}
            </div>
            
            <div className="form-group">
              <label>登录密码 <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                placeholder="请输入密码（至少6位）"
                style={{ borderColor: passwordError ? '#e74c3c' : '' }}
              />
              {passwordError && (
                <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', margin: 0 }}>
                  {passwordError}
                </p>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '登录中...' : '立即登录'}
            </button>
          </form>
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666' }}>
            还没有账号？<Link to="/register" style={{ color: '#3498db', fontWeight: 'bold' }}>立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
