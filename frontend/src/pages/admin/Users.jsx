import React, { useEffect, useState } from 'react';
import { authAPI } from '../../utils/api';

function AdminUsers() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getProfile();
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>用户管理</h2>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn" onClick={loadData}>重试</button>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>当前管理员信息</h3>
        {profile && (
          <table className="table">
            <tbody>
              <tr>
                <td style={{ width: '150px' }}>用户ID</td>
                <td>{profile.id}</td>
              </tr>
              <tr>
                <td>用户名</td>
                <td>{profile.username}</td>
              </tr>
              <tr>
                <td>手机号</td>
                <td>{profile.phone || '-'}</td>
              </tr>
              <tr>
                <td>注册时间</td>
                <td>{new Date(profile.created_at).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>优惠券统计</h4>
          {profile?.couponStats && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-value">{profile.couponStats.total || 0}</div>
                <div className="stat-label">总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#52c41a' }}>{profile.couponStats.unused || 0}</div>
                <div className="stat-label">未使用</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#ff4d4f' }}>{profile.couponStats.used || 0}</div>
                <div className="stat-label">已使用</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>说明</h3>
        <ul style={{ paddingLeft: '20px', color: '#666', lineHeight: '2' }}>
          <li>用户管理功能需要管理员权限</li>
          <li>可以在后端数据库中直接管理用户数据</li>
          <li>默认管理员账号: admin / admin123</li>
          <li>测试账号: testuser / test123</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminUsers;
