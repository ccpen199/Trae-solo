import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole, type RegisterForm } from '../types';
import { UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: UserRole.GUEST,
  });
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch {
      // error is handled by store
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      [UserRole.LANDLORD]: '房东',
      [UserRole.GUEST]: '住客',
      [UserRole.CLEANER]: '保洁人员',
      [UserRole.CHANNEL_PLATFORM]: '渠道平台',
      [UserRole.ADMIN]: '管理员',
    };
    return labels[role] || role;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--gray-50)',
        padding: '1rem',
      }}
    >
      <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--success-color)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <UserPlus size={32} style={{ color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            创建账户
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            注册成为系统用户
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              color: 'var(--danger-color)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">角色类型</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleInputChange}
              required
            >
              <option value={UserRole.GUEST}>{getRoleLabel(UserRole.GUEST)}</option>
              <option value={UserRole.LANDLORD}>{getRoleLabel(UserRole.LANDLORD)}</option>
              <option value={UserRole.CLEANER}>{getRoleLabel(UserRole.CLEANER)}</option>
              <option value={UserRole.CHANNEL_PLATFORM}>
                {getRoleLabel(UserRole.CHANNEL_PLATFORM)}
              </option>
              <option value={UserRole.ADMIN}>{getRoleLabel(UserRole.ADMIN)}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">姓名</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={form.name}
              onChange={handleInputChange}
              placeholder="请输入姓名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">邮箱地址</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={form.email}
              onChange={handleInputChange}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号码</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={form.phone}
              onChange={handleInputChange}
              placeholder="请输入手机号码"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={form.password}
              onChange={handleInputChange}
              placeholder="请输入密码（至少6位）"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={isLoading}
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            已有账户？
            <Link
              to="/login"
              style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                marginLeft: '0.25rem',
              }}
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
