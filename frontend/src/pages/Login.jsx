import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore, useToastStore } from '../store';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const showToast = useToastStore((state) => state.showToast);

  const handleSubmit = async () => {
    if (!phone || !password) {
      showToast('请输入手机号和密码');
      return;
    }

    setLoading(true);
    try {
      const res = isRegister 
        ? await authAPI.register(phone, password)
        : await authAPI.login(phone, password);
      
      setAuth(res.data.data.token, res.data.data.user);
      showToast(isRegister ? '注册成功' : '登录成功');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1 className="login-title">{isRegister ? '注册' : '登录'}</h1>
      <p className="login-subtitle">欢迎来到短视频世界</p>
      
      <div className="login-input-group">
        <label className="login-label">手机号</label>
        <input
          className="login-input"
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
        />
      </div>
      
      <div className="login-input-group">
        <label className="login-label">密码</label>
        <input
          className="login-input"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputMode="text"
        />
      </div>
      
      <button 
        className="login-btn" 
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? '加载中...' : (isRegister ? '注册' : '登录')}
      </button>
      
      <div className="login-switch">
        {isRegister ? '已有账号？' : '没有账号？'}
        <span onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? '去登录' : '去注册'}
        </span>
      </div>
    </div>
  );
};

export default Login;
