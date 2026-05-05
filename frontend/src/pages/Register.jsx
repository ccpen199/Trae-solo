import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateRegistration, GENDER_VALUES, genderLabels } from '../utils/validation';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, isAdmin, loading: authLoading, register } = useAuth();
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

    const validation = validateRegistration(formData);
    
    if (!validation.isValid) {
      const fieldErrors = {};
      validation.errors.forEach(err => {
        if (err.includes('用户名')) fieldErrors.username = err;
        else if (err.includes('密码')) {
          if (err.includes('少于6')) fieldErrors.password = err;
          else if (err.includes('不一致')) fieldErrors.confirmPassword = err;
          else fieldErrors.password = err;
        }
        else if (err.includes('确认密码')) fieldErrors.confirmPassword = err;
        else if (err.includes('年龄')) fieldErrors.age = err;
        else if (err.includes('性别')) fieldErrors.gender = err;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setSuccessMessage('注册成功！即将跳转到登录页...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      setGeneralError(error.message || '注册失败，请稍后重试');
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
      <div className="card" style={{ maxWidth: '560px' }}>
        <div className="card-header">
          <h1>用户注册</h1>
          <p>创建新账号以使用系统功能</p>
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
              placeholder="请输入用户名（3-20个字符）"
              disabled={loading}
            />
            <div className="form-hint">用户名长度3-20个字符</div>
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
              placeholder="请输入密码（至少6位）"
              disabled={loading}
            />
            <div className="form-hint">密码长度至少6个字符</div>
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label>
              确认密码<span className="required">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="请再次输入密码"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <div className="form-error">{errors.confirmPassword}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>年龄</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className={`form-control ${errors.age ? 'error' : ''}`}
                placeholder="请输入年龄"
                disabled={loading}
              />
              <div className="form-hint">年龄范围1-150</div>
              {errors.age && (
                <div className="form-error">{errors.age}</div>
              )}
            </div>

            <div className="form-group">
              <label>性别</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`form-control ${errors.gender ? 'error' : ''}`}
                disabled={loading}
              >
                <option value="">请选择</option>
                {GENDER_VALUES.map(g => (
                  <option key={g} value={g}>{genderLabels[g]}</option>
                ))}
              </select>
              {errors.gender && (
                <div className="form-error">{errors.gender}</div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <div className="form-footer">
          <p>
            已有账号？
            <Link to="/login">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
