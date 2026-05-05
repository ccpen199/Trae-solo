import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await userApi.updateProfile(profileForm);
      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      setMessage({ type: 'success', text: '个人信息更新成功' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '更新失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少需要6个字符' });
      return;
    }

    setLoading(true);

    try {
      await userApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '密码修改失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role) => {
    return role === 'admin' ? '管理员' : '普通用户';
  };

  const getStatusText = (status) => {
    const statusMap = {
      active: '正常',
      inactive: '未激活',
      banned: '已禁用',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="container">
      <h1 className="page-title">个人中心</h1>
      
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="profile-tabs">
        <div
          className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          个人信息
        </div>
        <div
          className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          修改密码
        </div>
      </div>
      
      {activeTab === 'info' && (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div>
              <h3 style={{ marginBottom: 20, color: '#333' }}>账户信息</h3>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#666', marginRight: 8 }}>邮箱:</span>
                <span>{user?.email}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#666', marginRight: 8 }}>角色:</span>
                <span>{getRoleText(user?.role)}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#666', marginRight: 8 }}>账户状态:</span>
                <span style={{ color: user?.status === 'active' ? '#52c41a' : '#ff4d4f' }}>
                  {getStatusText(user?.status)}
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#666', marginRight: 8 }}>注册时间:</span>
                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
              </div>
            </div>
            
            <div>
              <h3 style={{ marginBottom: 20, color: '#333' }}>编辑信息</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    name="username"
                    className="form-input"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    placeholder="请输入用户名"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">手机号</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="请输入手机号"
                    pattern="[0-9]{10,15}"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">收货地址</label>
                  <textarea
                    name="address"
                    className="form-input form-textarea"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    placeholder="请输入收货地址"
                    style={{ minHeight: 80 }}
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存修改'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'password' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 20, color: '#333' }}>修改密码</h3>
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label">当前密码</label>
              <input
                type="password"
                name="currentPassword"
                className="form-input"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="请输入当前密码"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">新密码</label>
              <input
                type="password"
                name="newPassword"
                className="form-input"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="请输入新密码（至少6个字符）"
                required
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="请再次输入新密码"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '修改中...' : '确认修改'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
