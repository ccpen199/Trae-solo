import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const roleRoutes = {
  admin: '/admin',
  landlord: '/dashboard/landlord',
  tenant: '/dashboard/tenant'
};

const roleCards = [
  { value: 'tenant', label: '我要租房', icon: '🏠', desc: '寻找心仪房源，签约入住', color: '#1890ff' },
  { value: 'landlord', label: '我是房东', icon: '👑', desc: '发布房源，管理出租', color: '#52c41a' }
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'tenant',
    real_name: '',
    id_card: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    if (formData.password.length < 6) {
      setError('密码至少6位');
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入正确的手机号');
      return false;
    }
    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('用户名长度应为3-20个字符');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const submitData = { ...formData };
      delete submitData.confirmPassword;
      
      const response = await api.post('/auth/register', submitData);
      login(response.data.user, response.data.token);
      
      setSuccess('🎉 注册成功！正在跳转到工作台...');
      
      setTimeout(() => {
        const redirectPath = roleRoutes[response.data.user.role] || '/';
        navigate(redirectPath, { 
          state: { 
            message: `欢迎加入，${response.data.user.real_name || response.data.user.username}！` 
          } 
        });
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || '注册失败，请重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', padding: '3rem 0' }}>
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-2">创建账号</h2>
          <p className="text-center text-gray mb-6">加入直连家园，开启去中介化居住交易</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="alert" style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              color: '#52c41a',
              marginBottom: '1rem'
            }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">选择您的身份</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {roleCards.map(role => (
                <div
                  key={role.value}
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${formData.role === role.value ? role.color : '#e8e8e8'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: formData.role === role.value ? `${role.color}10` : 'white',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{role.icon}</div>
                  <div style={{ fontWeight: 'bold' }}>{role.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{role.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">用户名 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="3-20个字符"
              />
            </div>

            <div className="form-group">
              <label className="form-label">手机号 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="请输入11位手机号"
              />
            </div>

            <div className="form-group">
              <label className="form-label">密码 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="至少6位"
              />
            </div>

            <div className="form-group">
              <label className="form-label">确认密码 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="再次输入密码"
              />
            </div>

            <div style={{ 
              background: '#fffbe6', 
              border: '1px solid #ffe58f', 
              borderRadius: '8px', 
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '13px'
            }}>
              <p style={{ color: '#d48806', margin: 0 }}>
                💡 填写真实姓名和身份证号可完成实名认证，提高信用分，享受免押等特权
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">真实姓名（选填）</label>
              <input
                type="text"
                name="real_name"
                className="form-input"
                value={formData.real_name}
                onChange={handleChange}
                placeholder="请输入真实姓名"
              />
            </div>

            <div className="form-group">
              <label className="form-label">身份证号（选填）</label>
              <input
                type="text"
                name="id_card"
                className="form-input"
                value={formData.id_card}
                onChange={handleChange}
                placeholder="请输入身份证号"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? (
                <span>🔄 注册中...</span>
              ) : (
                <span>立即注册</span>
              )}
            </button>
          </form>

          <p className="text-center text-gray mt-4">
            已有账号？ <Link to="/login" style={{ color: '#1890ff', fontWeight: 'bold' }}>立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
