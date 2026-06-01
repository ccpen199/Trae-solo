import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function AdminLogin() {
  const navigate = useNavigate();
  const setAdmin = useAuthStore((state) => state.setAdmin);
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authAPI.adminLogin(form);
      const { admin, token } = res.data.data;
      setAdmin(admin, token);
      alert('登录成功！');
      navigate('/admin');
    } catch (err) {
      alert(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <h2>管理后台登录</h2>
        <p className="login-subtitle">请使用管理员账号登录</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>管理员账号 *</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入管理员账号"
              required
            />
          </div>
          <div className="form-group">
            <label>密码 *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-tips">
          <p>预置管理员账号：</p>
          <ul>
            <li>超级管理员：admin / admin123</li>
            <li>区县管理员：district_admin / admin123</li>
            <li>社区审核员：reviewer / admin123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
