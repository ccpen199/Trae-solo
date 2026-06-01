import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function Profile() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.profile();
      setProfile(res.data.data);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="page">
      <h1 className="page-title">个人中心</h1>

      <div className="profile-header card">
        <div className="avatar">
          {profile?.real_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
        </div>
        <div className="profile-info">
          <h2>{profile?.real_name || profile?.username}</h2>
          <p>📱 {profile?.phone}</p>
          <p>📍 常驻区域：{profile?.region_name}</p>
          <p>🎯 角色：{profile?.role === 'individual' ? '个人用户' : profile?.role === 'enterprise' ? '企业用户' : '审核员'}</p>
          <p>📅 注册时间：{new Date(profile?.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</button>
        <button className={`tab ${activeTab === 'my-publish' ? 'active' : ''}`} onClick={() => setActiveTab('my-publish')}>我的发布</button>
        <button className={`tab ${activeTab === 'my-apply' ? 'active' : ''}`} onClick={() => setActiveTab('my-apply')}>我的申请</button>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3>基本信息</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>用户名</label>
              <span>{profile?.username}</span>
            </div>
            <div className="detail-item">
              <label>真实姓名</label>
              <span>{profile?.real_name || '未填写'}</span>
            </div>
            <div className="detail-item">
              <label>手机号</label>
              <span>{profile?.phone}</span>
            </div>
            <div className="detail-item">
              <label>身份证号</label>
              <span>{profile?.id_card ? profile?.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '未验证'}</span>
            </div>
            <div className="detail-item">
              <label>常驻行政区划</label>
              <span>{profile?.region_name}</span>
            </div>
            <div className="detail-item">
              <label>区划代码</label>
              <span>{profile?.region_code}</span>
            </div>
            <div className="detail-item">
              <label>用户角色</label>
              <span>{profile?.role === 'individual' ? '个人用户' : profile?.role === 'enterprise' ? '企业用户' : '审核员'}</span>
            </div>
            <div className="detail-item">
              <label>实名认证</label>
              <span className={`badge ${profile?.id_verified ? 'badge-success' : 'badge-warning'}`}>
                {profile?.id_verified ? '已认证' : '未认证'}
              </span>
            </div>
          </div>

          {profile?.enterprise_info && (
            <div className="detail-section">
              <h3>企业信息</h3>
              <div className="info-box">
                <p><strong>企业名称：</strong>{profile.enterprise_info.name}</p>
                <p><strong>统一社会信用代码：</strong>{profile.enterprise_info.credit_code}</p>
                <p><strong>企业地址：</strong>{profile.enterprise_info.address}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-publish' && (
        <div className="card">
          <h3>我的发布</h3>
          <div className="empty">暂无发布记录</div>
        </div>
      )}

      {activeTab === 'my-apply' && (
        <div className="card">
          <h3>我的申请</h3>
          <div className="empty">暂无申请记录</div>
        </div>
      )}
    </div>
  );
}

export default Profile;
