import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    wechat: user?.wechat || ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        wechat: user.wechat || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.put('/users/profile', formData);
      updateUser(formData);
      setSuccess('个人信息更新成功');
    } catch (err: any) {
      setError(err.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('新密码至少6位');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.put('/users/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('密码修改成功');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="flex flex-between mb-20">
          <h2>个人中心</h2>
          <span className={`badge ${user?.plan === 'pro' ? 'badge-warning' : 'badge-primary'}`}>
            {user?.plan === 'pro' ? '专业版' : '免费版'}
          </span>
        </div>

        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setActiveTab('info'); }}
          >
            个人信息
          </div>
          <div 
            className={`tab ${activeTab === 'password' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setActiveTab('password'); }}
          >
            修改密码
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {activeTab === 'info' && (
          <div className="grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">用户名</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUpdateProfile())}
                />
              </div>
              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUpdateProfile())}
                />
              </div>
              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="选填"
                />
              </div>
              <div className="form-group">
                <label className="form-label">微信号</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.wechat}
                  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                  placeholder="选填"
                />
              </div>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={(e) => { e.preventDefault(); handleUpdateProfile(); }} 
                disabled={loading}
              >
                {loading ? '保存中...' : '保存修改'}
              </button>
            </div>
            <div>
              <div className="card" style={{ background: '#fafafa' }}>
                <h4 className="mb-20">我的权益</h4>
                <div className="mb-10">
                  <p className="text-muted">个人会议号</p>
                  <p className="meeting-number text-primary">{user?.meetingNumber}</p>
                </div>
                <div className="mb-10">
                  <p className="text-muted">云录制空间</p>
                  <p className="text-primary">{user?.recordingSpace || 0} MB / {user?.maxRecordingSpace || 1000} MB</p>
                  <div style={{ width: '100%', height: '8px', background: '#e8e8e8', borderRadius: '4px', marginTop: '8px' }}>
                    <div
                      style={{
                        width: `${Math.min(((user?.recordingSpace || 0) / (user?.maxRecordingSpace || 1000)) * 100, 100)}%`,
                        height: '100%',
                        background: '#1890ff',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
                <div className="mb-10">
                  <p className="text-muted">最大参会人数</p>
                  <p className="text-primary">{user?.plan === 'pro' ? '500' : '100'} 人</p>
                </div>
                <div>
                  <p className="text-muted">注册时间</p>
                  <p className="text-primary">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div style={{ maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">当前密码</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUpdatePassword())}
                placeholder="请输入当前密码"
              />
            </div>
            <div className="form-group">
              <label className="form-label">新密码</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUpdatePassword())}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUpdatePassword())}
                placeholder="请再次输入新密码"
              />
            </div>
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={(e) => { e.preventDefault(); handleUpdatePassword(); }} 
              disabled={loading}
            >
              {loading ? '修改中...' : '修改密码'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
