import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username || !password) {
      showToast('请填写用户名和密码');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (isLogin) {
        res = await authAPI.login({ username, password });
      } else {
        res = await authAPI.register({ username, password, email });
      }

      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        showToast(isLogin ? '登录成功' : '注册成功');
        navigate('/');
      } else {
        showToast(res.data.message || '操作失败');
      }
    } catch (error) {
      showToast(error.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-color)' }}>海词词典</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>你的随身英语学习助手</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              padding: '0 16px 8px 16px',
              cursor: 'pointer',
              color: isLogin ? 'var(--primary-color)' : 'var(--text-light)',
              borderBottom: isLogin ? '2px solid var(--primary-color)' : 'none'
            }}
            onClick={() => setIsLogin(true)}
          >
            登录
          </span>
          <span style={{ color: 'var(--text-light)' }}>|</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              padding: '0 16px 8px 16px',
              cursor: 'pointer',
              color: !isLogin ? 'var(--primary-color)' : 'var(--text-light)',
              borderBottom: !isLogin ? '2px solid var(--primary-color)' : 'none'
            }}
            onClick={() => setIsLogin(false)}
          >
            注册
          </span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>用户名</label>
          <input
            type="text"
            className="input"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {!isLogin && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>邮箱（可选）</label>
            <input
              type="email"
              className="input"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>密码</label>
          <input
            type="password"
            className="input"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>
      </div>

      <button
        className="btn btn-outline"
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => navigate('/')}
      >
        游客浏览
      </button>
    </div>
  );
}

export default Login;
