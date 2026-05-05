import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { RegisterParams } from '@/types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  
  const [formData, setFormData] = useState<RegisterParams>({
    nickname: '',
    password: '',
    confirmPassword: '',
    gender: 'unknown',
    age: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!formData.nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    
    if (formData.nickname.trim().length < 1 || formData.nickname.trim().length > 20) {
      setError('昵称长度应在1-20个字符之间');
      return;
    }
    
    if (!formData.password) {
      setError('请输入密码');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (formData.age !== 0 && (formData.age < 1 || formData.age > 150)) {
      setError('年龄必须在1-150之间');
      return;
    }
    
    setLoading(true);
    try {
      const result = await authApi.register(formData);
      
      if (result.success && result.data) {
        setSuccessMessage(`注册成功！您的QQ号是：${result.data.user.qqNumber}`);
        setUser(result.data.user);
        setToken(result.data.token);
        
        setFormData({
          nickname: '',
          password: '',
          confirmPassword: '',
          gender: 'unknown',
          age: 0
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message || '注册失败');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1 className="form-title">注册QQ账号</h1>
        <p className="form-subtitle">填写资料，申请QQ号码</p>
        
        {successMessage && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: '8px', 
            marginBottom: '20px',
            color: '#52c41a',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">昵称 *</label>
            <input
              type="text"
              name="nickname"
              className="form-input"
              placeholder="请输入昵称（1-20个字符）"
              value={formData.nickname}
              onChange={handleChange}
              maxLength={20}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">密码 *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="请输入密码（至少6位）"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">确认密码 *</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">性别</label>
            <select
              name="gender"
              className="form-select"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="unknown">保密</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">年龄</label>
            <input
              type="number"
              name="age"
              className="form-input"
              placeholder="请输入年龄（选填）"
              value={formData.age || ''}
              onChange={handleChange}
              min={1}
              max={150}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button
            type="submit"
            className="form-button"
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <div className="form-footer">
          已有QQ账号？
          <Link to="/login" className="form-link">立即登录</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
