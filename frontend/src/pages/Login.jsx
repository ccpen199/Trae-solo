import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login: authLogin, register: authRegister } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await authLogin({ username: form.username, password: form.password });
      } else {
        await authRegister(form);
      }
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || '操作失败，请重试');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">{isLogin ? '登录' : '注册'}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名"
              required
            />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="请输入邮箱"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>
          <button type="submit" className="form-btn">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>
        <div className="form-switch">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}>
            {isLogin ? '立即注册' : '立即登录'}
          </a>
        </div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          测试账号: demo / 123456
        </div>
      </div>
    </div>
  );
}

export default Login;
