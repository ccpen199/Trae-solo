import React, { useState } from 'react';
import { useAuthStore } from '@/store';
import { userApi } from '@/services/api';
import { User } from '@/types';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuthStore();
  const [formData, setFormData] = useState<Partial<User>>(user ? {
    nickname: user.nickname,
    avatar: user.avatar,
    gender: user.gender,
    age: user.age,
    signature: user.signature,
    allowAddFriend: user.allowAddFriend,
    needVerification: user.needVerification
  } : {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.nickname?.trim() === '') {
      setError('昵称不能为空');
      return;
    }
    
    if (formData.nickname && (formData.nickname.trim().length < 1 || formData.nickname.trim().length > 20)) {
      setError('昵称长度应在1-20个字符之间');
      return;
    }
    
    if (formData.signature && formData.signature.length > 100) {
      setError('个性签名长度不能超过100个字符');
      return;
    }
    
    if (formData.age !== undefined && formData.age !== 0 && (formData.age < 1 || formData.age > 150)) {
      setError('年龄必须在1-150之间');
      return;
    }
    
    setLoading(true);
    try {
      const result = await userApi.updateProfile(formData);
      
      if (result.success && result.data) {
        updateProfile(result.data);
        setSuccess('资料更新成功');
        setTimeout(() => {
          setSuccess('');
        }, 2000);
      } else {
        setError(result.message || '更新失败');
      }
    } catch (err) {
      setError('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">个人资料</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-section">
              <div className="profile-section-title">基本信息</div>
              
              <div className="profile-row">
                <label className="profile-label">QQ号</label>
                <span className="profile-value">{user?.qqNumber}</span>
              </div>
              
              <div className="profile-row">
                <label className="profile-label">昵称</label>
                <input
                  type="text"
                  name="nickname"
                  className="form-input"
                  value={formData.nickname || ''}
                  onChange={handleChange}
                  maxLength={20}
                  style={{ marginBottom: 0 }}
                />
              </div>
              
              <div className="profile-row">
                <label className="profile-label">性别</label>
                <select
                  name="gender"
                  className="form-select"
                  value={formData.gender || 'unknown'}
                  onChange={handleChange}
                  style={{ marginBottom: 0, flex: 1 }}
                >
                  <option value="unknown">保密</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              
              <div className="profile-row">
                <label className="profile-label">年龄</label>
                <input
                  type="number"
                  name="age"
                  className="form-input"
                  placeholder="选填"
                  value={formData.age || ''}
                  onChange={handleChange}
                  min={1}
                  max={150}
                  style={{ marginBottom: 0, flex: 1 }}
                />
              </div>
              
              <div className="profile-row">
                <label className="profile-label">签名</label>
                <textarea
                  name="signature"
                  className="form-input"
                  placeholder="写下你的个性签名..."
                  value={formData.signature || ''}
                  onChange={handleChange}
                  maxLength={100}
                  rows={2}
                  style={{ 
                    marginBottom: 0, 
                    flex: 1,
                    resize: 'none',
                    height: 'auto',
                    paddingTop: '8px',
                    paddingBottom: '8px'
                  }}
                />
              </div>
            </div>
            
            <div className="profile-section">
              <div className="profile-section-title">安全设置</div>
              
              <div className="profile-row">
                <label className="profile-label">允许添加</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="allowAddFriend"
                    checked={formData.allowAddFriend ?? true}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="profile-row">
                <label className="profile-label">需要验证</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="needVerification"
                    checked={formData.needVerification ?? true}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}
            {success && (
              <div style={{ 
                padding: '12px 16px', 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f', 
                borderRadius: '8px', 
                marginBottom: '12px',
                color: '#52c41a',
                textAlign: 'center',
                fontWeight: 500
              }}>
                {success}
              </div>
            )}
            
            <div className="modal-footer" style={{ padding: '0', borderTop: 'none' }}>
              <button
                type="button"
                className="chat-button secondary"
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="submit"
                className="chat-button primary"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
