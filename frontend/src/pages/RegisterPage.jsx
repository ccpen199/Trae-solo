import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'social',
    campus_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('注册表单数据:', formData);

    try {
      const result = await register(formData);
      console.log('注册成功:', result);
      navigate('/login');
    } catch (error) {
      console.error('注册失败:', error);
      setError(error.response?.data?.detail || error.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>注册账号</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名 *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>邮箱</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>姓名</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>用户类型</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="social">社会用户</option>
            <option value="campus">校园用户</option>
          </select>
        </div>
        {formData.role === 'campus' && (
          <div className="form-group">
            <label>校园卡号</label>
            <input
              type="text"
              name="campus_id"
              value={formData.campus_id}
              onChange={handleChange}
            />
          </div>
        )}
        <div className="form-group">
          <label>密码 *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ 
            width: '100%',
            marginTop: '10px'
          }}
        >
          {loading ? '注册中...' : '注册'}
        </button>
        
        {loading && (
          <div style={{ 
            marginTop: '15px', 
            textAlign: 'center', 
            color: '#3b82f6',
            fontSize: '14px'
          }}>
            正在处理注册请求...
          </div>
        )}
      </form>
      
      <p style={{ marginTop: 20, textAlign: 'center' }}>
        已有账号？<Link to="/login">立即登录</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
