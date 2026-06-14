import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const roleRoutes = {
  admin: '/admin',
  landlord: '/dashboard/landlord',
  tenant: '/dashboard/tenant'
};

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData = {
        phone: formData.username,
        password: formData.password
      };
      const response = await api.post('/auth/login', loginData);
      login(response.data.user, response.data.token);
      
      const redirectPath = roleRoutes[response.data.user.role] || '/';
      navigate(redirectPath, { 
        state: { 
          message: `欢迎回来，${response.data.user.real_name || response.data.user.username}！` 
        } 
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || '登录失败，请重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', padding: '3rem 0' }}>
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center mb-2">欢迎回来</h2>
          <p className="text-center text-gray mb-8">登录直连家园，开启无忧居住体验</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input
                type="tel"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="请输入手机号"
              />
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="请输入密码"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <span>🔄 登录中...</span>
              ) : (
                <span>登 录</span>
              )}
            </button>
          </form>

          <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
            <p className="text-gray">
              还没有账号？ <Link to="/register" style={{ color: '#1890ff', fontWeight: 'bold' }}>立即注册</Link>
            </p>
          </div>

          <div style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: '8px', 
            padding: '1rem',
            fontSize: '13px'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#389e0d' }}>📱 测试账号：</p>
            <div style={{ display: 'grid', gap: '0.3rem', color: '#52c41a' }}>
              <p>👑 管理员: 13800000000 / admin123</p>
              <p>🏠 房东: 13800000001 / 123456</p>
              <p>👤 租客: 13800000002 / 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
