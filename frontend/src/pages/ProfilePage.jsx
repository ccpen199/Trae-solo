import React, { useState, useEffect } from 'react';
import { userApi } from '../api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    avatar: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    try {
      const data = await userApi.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar: data.avatar_url }));
      setUser(prev => ({ ...prev, avatar: data.avatar_url }));
      setSuccess('头像更新成功');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await userApi.updateProfile({
        nickname: formData.nickname,
        email: formData.email,
      });
      setUser(data.user);
      setSuccess('个人信息更新成功');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitial = () => {
    if (formData.nickname) return formData.nickname.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        个人中心
      </h1>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '40px',
            fontWeight: 600,
            margin: '0 auto 16px',
            overflow: 'hidden',
          }}>
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getInitial()
            )}
          </div>
          <label style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: '#f3f4f6',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
          }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
              disabled={saving}
            />
            📷 更换头像
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="input"
              value={user?.username || ''}
              disabled
              style={{ background: '#f9fafb', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">昵称</label>
            <input
              type="text"
              name="nickname"
              className="input"
              placeholder="请输入昵称"
              value={formData.nickname}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              disabled
              style={{ background: '#f9fafb', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && (
            <div style={{
              padding: '12px 16px',
              background: '#d1fae5',
              color: '#065f46',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ width: '100%' }}
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          会员信息
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            padding: '6px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            免费版
          </div>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            基础会议功能，单场最多100人参会
          </span>
        </div>
        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={() => alert('升级功能开发中...')}
        >
          升级到专业版
        </button>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          账号绑定
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: '#f9fafb',
            borderRadius: '8px',
          }}>
            <span>微信</span>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 16px', fontSize: '14px' }}
              onClick={() => alert('微信绑定开发中...')}
            >
              未绑定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
