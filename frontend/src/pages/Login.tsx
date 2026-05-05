import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await userApi.login(formData);
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        login(user, token);
        navigate('/');
      } else {
        setError(response.data.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试');
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
          用户登录
        </h1>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名/邮箱</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名或邮箱"
              required
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
              placeholder="请输入密码"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-secondary">
            还没有账号？
            <Link to="/register" className="text-primary" style={{ marginLeft: '0.5rem' }}>
              立即注册
            </Link>
          </p>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <p className="text-secondary text-center" style={{ fontSize: '0.875rem' }}>
            测试账号：
          </p>
          <div style={{ 
            background: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginTop: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <p><strong>管理员：</strong>admin / admin123</p>
            <p style={{ marginTop: '0.5rem' }}><strong>普通用户：</strong>注册后即可使用</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
