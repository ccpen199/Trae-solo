import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState({ username: '', password: '', nickname: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      showError('请输入用户名和密码');
      return;
    }
    if (formData.password.length < 6) {
      showError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    try {
      await register(formData.username, formData.password, formData.nickname || formData.username);
      showSuccess('注册成功');
      navigate('/');
    } catch (err) {
      showError(err.response?.data?.message || '注册失败，请稍后重试');
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
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>创建账号</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 32 }}>注册开始使用翻译君</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333', fontWeight: 500 }}>
              用户名
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="请输入用户名"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #ddd',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333', fontWeight: 500 }}>
              昵称
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              placeholder="请输入昵称（可选）"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #ddd',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333', fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="请输入密码（至少6位）"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #ddd',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none'
              }}
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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666', fontSize: 14 }}>
          已有账号？{' '}
          <Link to="/login" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 500 }}>
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
