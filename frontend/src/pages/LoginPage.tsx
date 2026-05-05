import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  
  const [qqNumber, setQqNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!qqNumber.trim()) {
      setError('请输入QQ号');
      return;
    }
    
    if (!/^\d{5,10}$/.test(qqNumber)) {
      setError('QQ号必须是5-10位数字');
      return;
    }
    
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    setLoading(true);
    try {
      const result = await authApi.login({ qqNumber, password });
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setToken(result.data.token);
        navigate('/');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1 className="form-title">QQ聊天系统</h1>
        <p className="form-subtitle">登录您的QQ账号</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">QQ号码</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入5-10位数字QQ号"
              value={qqNumber}
              onChange={(e) => setQqNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button
            type="submit"
            className="form-button"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="form-footer">
          还没有QQ账号？
          <Link to="/register" className="form-link">立即注册</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
