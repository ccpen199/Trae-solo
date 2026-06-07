import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    id_card: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await authAPI.register(form);
      } else {
        res = await authAPI.login(form);
      }

      if (res.data.success) {
        if (!isRegister) {
          onLogin(res.data.data.user);
          navigate('/');
        } else {
          alert('注册成功，请登录');
          setIsRegister(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', paddingTop: '60px' }}>
      <div className="card">
        <div className="card-title" style={{ textAlign: 'center' }}>
          <h2>{isRegister ? '志愿者注册' : '登录'}</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">真实姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">身份证号</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.id_card}
                  onChange={e => setForm({ ...form, id_card: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>

        {!isRegister && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#e6f7ff', borderRadius: '4px', fontSize: '14px' }}>
            <strong>测试账号：</strong><br />
            管理员：admin / admin123
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
