import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authAPI, regionAPI } from '../api/client';

function Register() {
  const [form, setForm] = useState({
    username: '',
    phone: '',
    password: '',
    real_name: '',
    id_card: '',
    region_code: '110105',
    role: 'resident'
  });
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const res = await regionAPI.getRegions({ level: 3 });
      setRegions(res.data.regions);
    } catch (err) {
      console.error('加载区域失败', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      setUser(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>用户注册</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名 *</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="请输入用户名"
            required
          />
        </div>
        <div className="form-group">
          <label>手机号 *</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="请输入手机号"
            required
          />
        </div>
        <div className="form-group">
          <label>密码 *</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="请输入密码"
            required
          />
        </div>
        <div className="form-group">
          <label>真实姓名</label>
          <input
            type="text"
            name="real_name"
            value={form.real_name}
            onChange={handleChange}
            placeholder="请输入真实姓名"
          />
        </div>
        <div className="form-group">
          <label>身份证号</label>
          <input
            type="text"
            name="id_card"
            value={form.id_card}
            onChange={handleChange}
            placeholder="请输入身份证号"
          />
        </div>
        <div className="form-group">
          <label>常驻行政区划 *</label>
          <select name="region_code" value={form.region_code} onChange={handleChange} required>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>{r.name} (POI密度: {r.poi_density})</option>
            ))}
          </select>
          <small style={{ color: '#666' }}>系统将自动为您绑定该区域，优先展示本地服务</small>
        </div>
        <div className="form-group">
          <label>用户角色 *</label>
          <select name="role" value={form.role} onChange={handleChange} required>
            <option value="resident">普通居民</option>
            <option value="individual_employer">个体雇主（家政/维修等）</option>
            <option value="enterprise_employer">企业雇主</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        已有账号？<a href="/login">立即登录</a>
      </p>
    </div>
  );
}

export default Register;
