import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      showSuccess('登录成功');
      navigate('/');
    } catch (err) {
      showError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f7',
      padding: 20
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>翻译君</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 32 }}>登录开始使用</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333', fontWeight: 500 }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #ddd',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333', fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #ddd',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666', fontSize: 14 }}>
          还没有账号？{' '}
          <Link to="/register" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 500 }}>
            立即注册
          </Link>
        </p>

        <div style={{ marginTop: 32, padding: 16, backgroundColor: '#f5f5f7', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
            <strong>提示：</strong>
          </p>
          <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
            您可以先注册一个新账号，未登录用户也可以使用基本翻译功能。<br/>
            口语跟读、收藏、发布等功能需要登录后使用。
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
