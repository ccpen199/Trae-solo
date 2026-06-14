import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

function Profile({ showToast }) {
  const { user, updateProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    nickname: '',
    real_name: '',
    phone: '',
    avatar: '',
    skills: '',
    location: '',
    latitude: '',
    longitude: '',
    available_slots: '',
    bio: '',
    id_card: '',
    id_card_front: '',
    id_card_back: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        real_name: user.real_name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        skills: user.skills?.join(', ') || '',
        location: user.location || '',
        latitude: user.latitude || '',
        longitude: user.longitude || '',
        available_slots: user.available_slots?.join(', ') || '',
        bio: user.bio || '',
        id_card: user.id_card || '',
        id_card_front: user.id_card_front || '',
        id_card_back: user.id_card_back || ''
      });
      setVerificationStatus(user.verification_status);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const updateData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        available_slots: formData.available_slots ? formData.available_slots.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      
      delete updateData.id_card;
      delete updateData.id_card_front;
      delete updateData.id_card_back;
      
      const response = await api.put('/auth/profile', updateData);
      updateProfile(response.data);
      showToast('资料更新成功', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || '更新失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!formData.real_name || !formData.id_card) {
      showToast('请填写真实姓名和身份证号', 'error');
      return;
    }
    
    try {
      setVerifying(true);
      await api.post('/auth/verify-id', {
        real_name: formData.real_name,
        id_card: formData.id_card,
        id_card_front: formData.id_card_front,
        id_card_back: formData.id_card_back
      });
      setVerificationStatus('pending');
      showToast('实名认证申请已提交，请等待审核', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || '提交失败', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      student: '在校学生',
      homemaker: '居家宝妈',
      parttime: '兼职上班族',
      employer: '企业雇主',
      admin: '平台管理员'
    };
    return labels[type] || type;
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return <span className="badge badge-success">已认证</span>;
      case 'pending':
        return <span className="badge badge-warning">审核中</span>;
      case 'rejected':
        return <span className="badge badge-danger">认证失败</span>;
      default:
        return <span className="badge badge-secondary">未认证</span>;
    }
  };

  if (!user) {
    return <div className="container" style={{ padding: '60px 20px' }}><div className="empty-state">请先登录</div></div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '32px' }}>个人中心</h1>
      
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 600
          }}>
            {user.nickname?.charAt(0) || user.username?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              {user.nickname || user.username}
            </div>
            <div style={{ color: '#64748b', marginBottom: '8px' }}>
              <span className="badge badge-info" style={{ marginRight: '8px' }}>
                {getTypeLabel(user.user_type)}
              </span>
              {getVerificationBadge()}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              信用分：{user.credit_score || 80} | 完成任务：{user.completed_tasks || 0}个
            </div>
          </div>
        </div>
      </div>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          基本资料
        </div>
        <div 
          className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          实名认证
        </div>
      </div>
      
      <div className="card">
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">昵称</label>
                <input
                  type="text"
                  className="form-input"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="请输入昵称"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  type="text"
                  className="form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="请输入手机号"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">所在地区</label>
                <input
                  type="text"
                  className="form-input"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="如：北京市朝阳区"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">技能标签（逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="如：写作, 设计, 推广, 销售"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">空闲时段（逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  name="available_slots"
                  value={formData.available_slots}
                  onChange={handleChange}
                  placeholder="如：周一至周五晚上, 周末全天"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">个人简介</label>
              <textarea
                className="form-textarea"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="简单介绍一下自己..."
                rows={4}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}
                    style={{ padding: '12px 32px' }}>
              {loading ? '保存中...' : '保存资料'}
            </button>
          </form>
        )}
        
        {activeTab === 'verify' && (
          <div>
            {verificationStatus === 'verified' ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ marginBottom: '8px' }}>实名认证已通过</h3>
                <p style={{ color: '#64748b' }}>您的真实信息已通过平台审核</p>
              </div>
            ) : verificationStatus === 'pending' ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ marginBottom: '8px' }}>审核中</h3>
                <p style={{ color: '#64748b' }}>您的实名认证申请正在审核，请耐心等待</p>
              </div>
            ) : (
              <>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  完成实名认证后，您可以接取更多高价值任务，享受T+1快速结算。
                </p>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">真实姓名 *</label>
                    <input
                      type="text"
                      className="form-input"
                      name="real_name"
                      value={formData.real_name}
                      onChange={handleChange}
                      placeholder="请输入真实姓名"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">身份证号 *</label>
                    <input
                      type="text"
                      className="form-input"
                      name="id_card"
                      value={formData.id_card}
                      onChange={handleChange}
                      placeholder="请输入18位身份证号"
                      maxLength={18}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">身份证正面照片链接</label>
                  <input
                    type="text"
                    className="form-input"
                    name="id_card_front"
                    value={formData.id_card_front}
                    onChange={handleChange}
                    placeholder="请上传身份证正面照片并填写链接"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">身份证背面照片链接</label>
                  <input
                    type="text"
                    className="form-input"
                    name="id_card_back"
                    value={formData.id_card_back}
                    onChange={handleChange}
                    placeholder="请上传身份证背面照片并填写链接"
                  />
                </div>
                
                <button onClick={handleVerify} className="btn btn-primary" disabled={verifying}
                        style={{ padding: '12px 32px' }}>
                  {verifying ? '提交中...' : '提交认证'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
