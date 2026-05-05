import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = '用户名不能为空';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      errors.username = '用户名长度需在3-50个字符之间';
    }

    if (!formData.email.trim()) {
      errors.email = '邮箱不能为空';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (formData.phone && !PHONE_REGEX.test(formData.phone)) {
      errors.phone = '请输入有效的手机号';
    }

    if (!formData.password) {
      errors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      errors.password = '密码长度至少6个字符';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await userApi.register(registerData);
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        login(user, token);
        navigate('/');
      } else {
        setError(response.data.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container section" style={{ maxWidth: '500px', marginTop: '4rem' }}>
      <div className="card card-body">
        <h1 className="section-title text-center" style={{ marginBottom: '2rem' }}>
          用户注册
        </h1>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名 *</label>
            <input
              type="text"
              name="username"
              className={`form-input ${fieldErrors.username ? 'error' : ''}`}
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名（3-50个字符）"
              required
              minLength={3}
            />
            {fieldErrors.username && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fieldErrors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">邮箱 *</label>
            <input
              type="email"
              name="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱地址（如：example@example.com）"
              required
            />
            {fieldErrors.email && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              name="phone"
              className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入手机号（选填，11位数字）"
            />
            {fieldErrors.phone && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fieldErrors.phone}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">密码 *</label>
            <input
              type="password"
              name="password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码（至少6个字符）"
              required
              minLength={6}
            />
            {fieldErrors.password && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fieldErrors.password}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">确认密码 *</label>
            <input
              type="password"
              name="confirmPassword"
              className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入密码"
              required
            />
            {fieldErrors.confirmPassword && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fieldErrors.confirmPassword}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-secondary">
            已有账号？
            <Link to="/login" className="text-primary" style={{ marginLeft: '0.5rem' }}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
