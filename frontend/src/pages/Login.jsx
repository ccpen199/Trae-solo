import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function Login() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const presetType = params.get('presetType') || location.state?.presetType;
  const demoAccounts = {
    shipper: { phone: '13900139001', password: '123456', username: '' },
    driver: { phone: '13800138001', password: '123456', username: '' },
    admin: { phone: '', password: 'admin123', username: 'admin' }
  };
  const [loginType, setLoginType] = useState(presetType || 'shipper');

  useEffect(() => {
    if (presetType) {
      setLoginType(presetType);
      setFormData(prev => ({ ...prev, ...demoAccounts[presetType] }));
    }
  }, [presetType]);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    phone: demoAccounts[presetType || 'shipper'].phone,
    password: demoAccounts[presetType || 'shipper'].password,
    name: '',
    username: demoAccounts[presetType || 'shipper'].username,
    vehicle_type: '',
    vehicle_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint;
      if (loginType === 'admin') {
        endpoint = `/auth/admin/login`;
      } else if (isRegister) {
        endpoint = `/auth/${loginType}/register`;
      } else {
        endpoint = `/auth/${loginType}/login`;
      }

      const res = await api.post(endpoint, formData);
      login(res.data.token, res.data.user, loginType);
      
      if (loginType === 'admin') {
        navigate('/admin');
      } else if (loginType === 'driver') {
        navigate('/driver');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ width: '420px', padding: '32px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
          {isRegister ? '注册账号' : '登录账号'}
        </h2>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          background: '#f5f5f5',
          padding: '4px',
          borderRadius: '8px'
        }}>
          {['shipper', 'driver', 'admin'].map(type => (
            <button
              key={type}
              onClick={() => {
                setLoginType(type);
                setIsRegister(false);
                setFormData(prev => ({ ...prev, ...demoAccounts[type] }));
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: loginType === type ? 'white' : 'transparent',
                color: loginType === type ? '#1677ff' : '#666',
                fontWeight: loginType === type ? 600 : 400,
                boxShadow: loginType === type ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {type === 'shipper' ? '货主' : type === 'driver' ? '司机' : '管理员'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            background: '#fff1f0', 
            color: '#ff4d4f', 
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {loginType === 'admin' ? (
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="请输入用户名"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>手机号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>

          {isRegister && loginType !== 'admin' && (
            <>
              <div className="form-group">
                <label>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                  required
                />
              </div>
              
              {loginType === 'driver' && (
                <>
                  <div className="form-group">
                    <label>车型</label>
                    <select
                      value={formData.vehicle_type}
                      onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                      required
                    >
                      <option value="">请选择车型</option>
                      <option value="小面">小面</option>
                      <option value="中面">中面</option>
                      <option value="金杯">金杯</option>
                      <option value="厢货">厢货</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>车牌号</label>
                    <input
                      type="text"
                      value={formData.vehicle_number}
                      onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })}
                      placeholder="请输入车牌号"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>
        </form>

        {loginType !== 'admin' && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setIsRegister(!isRegister)}
              style={{ color: '#1677ff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', color: '#666' }}>
          <strong>测试账号：</strong><br />
          货主：13900139001 / 123456 (张三)<br />
          司机：13800138001 / 123456 (张师傅)<br />
          管理员：admin / admin123
        </div>
      </div>
    </div>
  );
}
