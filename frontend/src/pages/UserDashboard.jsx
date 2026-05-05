import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../utils/api';
import { genderLabels, roleLabels } from '../utils/validation';
import Layout from '../components/Layout';

const UserDashboard = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      fetchUserDetails();
    }
  }, [user, authLoading, navigate]);

  const fetchUserDetails = async () => {
    try {
      const response = await userApi.getById(user.id);
      setUserDetails(response.data);
    } catch (error) {
      console.error('获取用户详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <Layout>
      <div className="page-content">
        <div className="container">
          <div className="page-title">
            <h2>个人主页</h2>
            <p>欢迎使用用户管理系统，您可以查看和管理个人信息</p>
          </div>

          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {userDetails?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3>{userDetails?.username}</h3>
                <p>
                  <span className={`role-badge ${userDetails?.role}`}>
                    {roleLabels[userDetails?.role]}
                  </span>
                </p>
              </div>
            </div>

            <div className="profile-section">
              <h4>基本信息</h4>
              <div className="profile-item">
                <span className="label">用户ID</span>
                <span className="value">{userDetails?.id}</span>
              </div>
              <div className="profile-item">
                <span className="label">用户名</span>
                <span className="value">{userDetails?.username}</span>
              </div>
              <div className="profile-item">
                <span className="label">角色</span>
                <span className="value">
                  <span className={`role-badge ${userDetails?.role}`}>
                    {roleLabels[userDetails?.role]}
                  </span>
                </span>
              </div>
              <div className="profile-item">
                <span className="label">年龄</span>
                <span className="value">{userDetails?.age ?? '-'}</span>
              </div>
              <div className="profile-item">
                <span className="label">性别</span>
                <span className="value">
                  {userDetails?.gender ? genderLabels[userDetails.gender] : '-'}
                </span>
              </div>
            </div>

            <div className="profile-section">
              <h4>账号信息</h4>
              <div className="profile-item">
                <span className="label">注册时间</span>
                <span className="value">{formatDate(userDetails?.created_at)}</span>
              </div>
              <div className="profile-item">
                <span className="label">最后更新</span>
                <span className="value">{formatDate(userDetails?.updated_at)}</span>
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #d9d9d9' }}>
              <Link to="/user/edit" className="btn btn-primary">
                修改资料
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
