import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('user');
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!phone) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入正确的11位手机号';
    }
    
    if (!nickname || nickname.trim().length < 2) {
      newErrors.nickname = '昵称至少2个字符';
    }
    
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码长度不能少于6位';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (role === 'provider') {
      if (!realName || realName.trim().length < 2) {
        newErrors.realName = '服务提供者必须填写真实姓名';
      }
      if (!idCard || !/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(idCard)) {
        newErrors.idCard = '服务提供者必须填写正确的18位身份证号';
      }
    }
    
    if (role === 'agent' && (!realName || !idCard)) {
      newErrors.realName = '城市运营必须完成实名认证';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register(phone, password, nickname, role, realName, idCard);
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.error;
      if (errMsg?.includes('已注册') || errMsg?.includes('exists')) {
        setError('该手机号已注册，请直接登录');
      } else {
        setError(errMsg || '注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="card">
          <h2 className="card-title">加入本地生活平台</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            免费注册，开启便捷的本地生活服务体验
          </p>
          
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>注册身份 <span style={{ color: '#e74c3c' }}>*</span></label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1, padding: '0.75rem', border: role === 'user' ? '2px solid #3498db' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👤</div>
                  <div style={{ fontWeight: 'bold' }}>普通用户</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>找服务、找房源</div>
                </label>
                <label style={{ flex: 1, padding: '0.75rem', border: role === 'provider' ? '2px solid #3498db' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>
                  <input
                    type="radio"
                    name="role"
                    value="provider"
                    checked={role === 'provider'}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🔧</div>
                  <div style={{ fontWeight: 'bold' }}>服务提供者</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>发布服务、接单</div>
                </label>
                <label style={{ flex: 1, padding: '0.75rem', border: role === 'agent' ? '2px solid #3498db' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>
                  <input
                    type="radio"
                    name="role"
                    value="agent"
                    checked={role === 'agent'}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏢</div>
                  <div style={{ fontWeight: 'bold' }}>城市运营</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>管理本地信息</div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>手机号码 <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) validateForm();
                }}
                placeholder="请输入11位手机号码"
                maxLength={11}
                style={{ borderColor: errors.phone ? '#e74c3c' : '' }}
              />
              {errors.phone && (
                <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  {errors.phone}
                </p>
              )}
            </div>
            
            <div className="form-group">
              <label>昵称 <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errors.nickname) validateForm();
                }}
                placeholder="给自己起个名字"
                style={{ borderColor: errors.nickname ? '#e74c3c' : '' }}
              />
              {errors.nickname && (
                <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  {errors.nickname}
                </p>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>设置密码 <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) validateForm();
                  }}
                  placeholder="至少6位密码"
                  style={{ borderColor: errors.password ? '#e74c3c' : '' }}
                />
                {errors.password && (
                  <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    {errors.password}
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label>确认密码 <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) validateForm();
                  }}
                  placeholder="再次输入密码"
                  style={{ borderColor: errors.confirmPassword ? '#e74c3c' : '' }}
                />
                {errors.confirmPassword && (
                  <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div style={{ background: role === 'user' ? '#f8f9fa' : (role === 'provider' ? '#fff3cd' : '#e8f4fd'), padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: role !== 'user' ? '2px solid' : '1px solid #eee', borderColor: role === 'provider' ? '#ffeaa7' : (role === 'agent' ? '#74b9ff' : '#eee') }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>📋 实名认证{role === 'user' ? '（可选，推荐完成）' : ' <span style="color: #e74c3c">*必填</span>'}</h4>
              {role === 'user' && (
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 1rem 0' }}>
                  完成实名认证后，发布的信息将获得「已认证」标识，可信度更高
                </p>
              )}
              {role === 'provider' && (
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 1rem 0' }}>
                  <strong>服务提供者必须完成实名认证</strong>，以确保服务真实性和可信度
                </p>
              )}
              {role === 'agent' && (
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 1rem 0' }}>
                  <strong>城市运营需完成实名认证并通过白名单审核</strong>，注册后需等待管理员审批
                </p>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>真实姓名 {role !== 'user' && <span style={{ color: '#e74c3c' }}>*</span>}</label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => {
                      setRealName(e.target.value);
                      if (errors.realName) validateForm();
                    }}
                    placeholder="请输入真实姓名"
                    style={{ borderColor: errors.realName ? '#e74c3c' : '' }}
                  />
                  {errors.realName && (
                    <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                      {errors.realName}
                    </p>
                  )}
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>身份证号 {role !== 'user' && <span style={{ color: '#e74c3c' }}>*</span>}</label>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => {
                      setIdCard(e.target.value);
                      if (errors.idCard) validateForm();
                    }}
                    placeholder="18位身份证号"
                    maxLength={18}
                    style={{ borderColor: errors.idCard ? '#e74c3c' : '' }}
                  />
                  {errors.idCard && (
                    <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                      {errors.idCard}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="form-group" style={{ margin: '1rem 0 0 0' }}>
                <label>所在城市</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="如：广州市"
                />
              </div>
            </div>

            {role === 'provider' && (
              <div style={{ background: '#e8f4fd', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>💼 服务者提示</h4>
                <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                  注册后可在「个人中心」上传资质证书，通过OCR核验后将获得「资质认证」标识
                </p>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '注册中...' : '立即注册'}
            </button>
          </form>
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666' }}>
            已有账号？<Link to="/login" style={{ color: '#3498db', fontWeight: 'bold' }}>立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
