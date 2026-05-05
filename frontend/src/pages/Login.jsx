import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateLogin } from '../utils/validation';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(isAdmin ? '/admin' : '/user');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    const validation = validateLogin(formData);
    
    if (!validation.isValid) {
      const fieldErrors = {};
      validation.errors.forEach(err => {
        if (err.includes('用户名')) fieldErrors.username = err;
        if (err.includes('密码')) fieldErrors.password = err;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await login(formData.username, formData.password);
      setSuccessMessage('登录成功，正在跳转...');
      setTimeout(() => {
        navigate(response.data.redirectTo);
      }, 500);
    } catch (error) {
      setGeneralError(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h1>用户登录</h1>
          <p>请输入您的账号信息登录系统</p>
        </div>

        {generalError && (
          <div className="alert alert-error">{generalError}</div>
        )}

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              用户名<span className="required">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-control ${errors.username ? 'error' : ''}`}
              placeholder="请输入用户名"
              disabled={loading}
            />
            {errors.username && (
              <div className="form-error">{errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label>
              密码<span className="required">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="请输入密码"
              disabled={loading}
            />
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="form-footer">
          <p>
            还没有账号？
            <Link to="/register">立即注册</Link>
          </p>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            测试账号：admin/admin123（管理员） | user/user123（普通用户）
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
