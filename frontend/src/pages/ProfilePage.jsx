import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, userAPI } from '../services/api';
import { format } from 'date-fns';

function ProfilePage() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    bio: '',
  });
  const [userComments, setUserComments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || '',
        full_name: currentUser.full_name || '',
        bio: currentUser.bio || '',
      });
      loadUserComments();
    }
  }, [currentUser]);

  const loadUserComments = async () => {
    try {
      const response = await userAPI.getComments();
      setUserComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(formData);
      setMessage('资料更新成功');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('更新失败，请稍后重试');
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      campus: '校园用户',
      social: '社会用户',
      guest: '游客',
      admin: '管理员',
      editor: '编辑',
    };
    return roleMap[role] || role;
  };

  if (!currentUser) {
    return <div className="loading">请先登录</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          {(currentUser.full_name || currentUser.username).charAt(0).toUpperCase()}
        </div>
        <h2 style={{ marginBottom: 10 }}>{currentUser.full_name || currentUser.username}</h2>
        <p style={{ color: '#666', marginBottom: 20 }}>
          角色: {getRoleText(currentUser.role)}
        </p>
        {currentUser.campus_id && (
          <p style={{ color: '#666' }}>校园卡号: {currentUser.campus_id}</p>
        )}
        <p style={{ color: '#999', marginTop: 20, fontSize: 14 }}>
          注册时间: {format(new Date(currentUser.created_at), 'yyyy-MM-dd')}
        </p>
      </div>

      <div className="profile-content">
        <h3 style={{ marginBottom: 20 }}>个人资料</h3>
        
        {message && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={currentUser.username}
              disabled
              style={{ background: '#f3f4f6' }}
            />
          </div>
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>姓名</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>个人简介</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            保存修改
          </button>
        </form>

        <div style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 20 }}>我的评论 ({userComments.length})</h3>
          {userComments.length === 0 ? (
            <div className="empty-state">暂无评论</div>
          ) : (
            userComments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-content">{comment.content}</div>
                <div className="comment-time">
                  {format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
