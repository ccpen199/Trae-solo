import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    const autoApply = searchParams.get('autoApply');
    if (user) {
      if (redirect) {
        const redirectUrl = autoApply ? `${redirect}?autoApply=${autoApply}` : redirect;
        navigate(redirectUrl, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'company') {
        navigate('/company/dashboard');
      } else if (user.role === 'jobseeker') {
        navigate('/jobseeker/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '登录失败，请重试';
      if (errorMsg.includes('密码') || errorMsg.includes('邮箱')) {
        setError('邮箱或密码错误，请检查后重试');
      } else if (errorMsg.includes('缺少')) {
        setError('请填写完整的邮箱和密码');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              ▶
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              欢迎回来
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              登录您的视聘账号
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                padding: '12px 16px', 
                background: '#fef2f2', 
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px', 
            fontSize: '14px',
            color: '#6b7280'
          }}>
            还没有账号？
            <Link to="/register" style={{ color: '#4f46e5', marginLeft: '4px' }}>
              立即注册
            </Link>
          </div>

          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
              测试账号：
            </div>
            <div style={{ color: '#6b7280' }}>
              管理员：admin@videocareer.com / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
